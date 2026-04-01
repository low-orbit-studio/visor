"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  hexToOklch,
  oklchToHex,
  clampToSrgb,
  rgbToHex,
} from "@loworbitstudio/visor-theme-engine";
import styles from "./oklch-picker.module.css";

const MAX_CHROMA = 0.37;
const HUE_PREVIEW_L = 0.7;
const HUE_PREVIEW_C = 0.15;

interface OklchPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function OklchPicker({ value, onChange }: OklchPickerProps) {
  const planeCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const planeWrapperRef = useRef<HTMLDivElement>(null);
  const hueWrapperRef = useRef<HTMLDivElement>(null);

  // Track current OKLCH values
  const [oklch, setOklch] = useState<[number, number, number]>(() => {
    try {
      return hexToOklch(value);
    } catch {
      return [0.55, 0.15, 260];
    }
  });

  // Cache the last rendered hue for the plane canvas to avoid re-rendering
  const lastRenderedHueRef = useRef<number>(-1);
  const animFrameRef = useRef<number>(0);
  const isDraggingPlaneRef = useRef(false);
  const isDraggingHueRef = useRef(false);

  // Sync external value changes
  useEffect(() => {
    try {
      const [L, C, H] = hexToOklch(value);
      setOklch((prev) => {
        // Avoid loops: only update if the incoming value actually differs
        const prevHex = oklchToHex(prev[0], prev[1], prev[2]);
        if (prevHex.toLowerCase() === value.toLowerCase()) return prev;
        return [L, C, H];
      });
    } catch {
      // Invalid hex — ignore
    }
  }, [value]);

  const [L, C, H] = oklch;

  // ─── Render Plane Canvas ─────────────────────────────────────────────
  const renderPlane = useCallback(
    (hue: number) => {
      const canvas = planeCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = canvas;
      if (width === 0 || height === 0) return;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        const lightness = 1.0 - y / (height - 1); // top = 1.0, bottom = 0.0
        for (let x = 0; x < width; x++) {
          const chroma = (x / (width - 1)) * MAX_CHROMA;
          const idx = (y * width + x) * 4;

          // Check if in gamut by comparing clamped vs unclamped
          const clamped = clampToSrgb(lightness, chroma, hue);
          const clampedHex = rgbToHex(clamped);
          const directHex = oklchToHex(lightness, chroma, hue);

          if (clampedHex !== directHex) {
            // Out of gamut — show dimmed version
            data[idx] = Math.round(clamped[0] * 0.4 + 128 * 0.6);
            data[idx + 1] = Math.round(clamped[1] * 0.4 + 128 * 0.6);
            data[idx + 2] = Math.round(clamped[2] * 0.4 + 128 * 0.6);
            data[idx + 3] = 255;
          } else {
            data[idx] = clamped[0];
            data[idx + 1] = clamped[1];
            data[idx + 2] = clamped[2];
            data[idx + 3] = 255;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      lastRenderedHueRef.current = hue;
    },
    []
  );

  // ─── Render Hue Canvas ───────────────────────────────────────────────
  const renderHue = useCallback(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    if (width === 0 || height === 0) return;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let x = 0; x < width; x++) {
      const hue = (x / (width - 1)) * 360;
      const rgb = clampToSrgb(HUE_PREVIEW_L, HUE_PREVIEW_C, hue);

      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        data[idx] = rgb[0];
        data[idx + 1] = rgb[1];
        data[idx + 2] = rgb[2];
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  // ─── Canvas Sizing & Initial Render ──────────────────────────────────
  useEffect(() => {
    const planeCanvas = planeCanvasRef.current;
    const hueCanvas = hueCanvasRef.current;
    if (!planeCanvas || !hueCanvas) return;

    // Use a reasonable resolution for perf (not retina-scaled)
    const planeRect = planeCanvas.getBoundingClientRect();
    const hueRect = hueCanvas.getBoundingClientRect();

    // Cap resolution for performance
    const maxDim = 200;
    planeCanvas.width = Math.min(maxDim, Math.round(planeRect.width));
    planeCanvas.height = Math.min(
      maxDim,
      Math.round(planeRect.height)
    );
    hueCanvas.width = Math.min(maxDim, Math.round(hueRect.width));
    hueCanvas.height = Math.min(24, Math.round(hueRect.height));

    renderHue();
    renderPlane(H);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderHue, renderPlane]);

  // ─── Re-render plane when hue changes ────────────────────────────────
  useEffect(() => {
    if (lastRenderedHueRef.current === H) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      renderPlane(H);
    });
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [H, renderPlane]);

  // ─── Plane Interaction ───────────────────────────────────────────────
  const handlePlaneInteraction = useCallback(
    (clientX: number, clientY: number) => {
      const wrapper = planeWrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      const newL = 1.0 - y;
      const newC = x * MAX_CHROMA;

      setOklch([newL, newC, H]);
      const hex = oklchToHex(newL, newC, H);
      onChange(hex);
    },
    [H, onChange]
  );

  const handlePlanePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDraggingPlaneRef.current = true;
      if ((e.target as HTMLElement).setPointerCapture) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
      handlePlaneInteraction(e.clientX, e.clientY);
    },
    [handlePlaneInteraction]
  );

  const handlePlanePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingPlaneRef.current) return;
      handlePlaneInteraction(e.clientX, e.clientY);
    },
    [handlePlaneInteraction]
  );

  const handlePlanePointerUp = useCallback(() => {
    isDraggingPlaneRef.current = false;
  }, []);

  // ─── Hue Interaction ─────────────────────────────────────────────────
  const handleHueInteraction = useCallback(
    (clientX: number) => {
      const wrapper = hueWrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newH = x * 360;

      setOklch([L, C, newH]);
      const hex = oklchToHex(L, C, newH);
      onChange(hex);
    },
    [L, C, onChange]
  );

  const handleHuePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDraggingHueRef.current = true;
      if ((e.target as HTMLElement).setPointerCapture) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
      handleHueInteraction(e.clientX);
    },
    [handleHueInteraction]
  );

  const handleHuePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingHueRef.current) return;
      handleHueInteraction(e.clientX);
    },
    [handleHueInteraction]
  );

  const handleHuePointerUp = useCallback(() => {
    isDraggingHueRef.current = false;
  }, []);

  // ─── Crosshair / Indicator Positions ─────────────────────────────────
  const crosshairX = `${(C / MAX_CHROMA) * 100}%`;
  const crosshairY = `${(1.0 - L) * 100}%`;
  const hueIndicatorX = `${(H / 360) * 100}%`;

  return (
    <div className={styles.picker} role="group" aria-label="OKLCH color picker">
      <div
        ref={planeWrapperRef}
        className={styles.planeWrapper}
        onPointerDown={handlePlanePointerDown}
        onPointerMove={handlePlanePointerMove}
        onPointerUp={handlePlanePointerUp}
        role="slider"
        aria-label="Lightness and chroma"
        aria-valuetext={`Lightness: ${L.toFixed(2)}, Chroma: ${C.toFixed(3)}`}
        tabIndex={0}
      >
        <canvas ref={planeCanvasRef} className={styles.planeCanvas} />
        <div
          className={styles.crosshair}
          style={{ left: crosshairX, top: crosshairY }}
        />
      </div>

      <div
        ref={hueWrapperRef}
        className={styles.hueWrapper}
        onPointerDown={handleHuePointerDown}
        onPointerMove={handleHuePointerMove}
        onPointerUp={handleHuePointerUp}
        role="slider"
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(H)}
        tabIndex={0}
      >
        <canvas ref={hueCanvasRef} className={styles.hueCanvas} />
        <div
          className={styles.hueIndicator}
          style={{ left: hueIndicatorX }}
        />
      </div>

      <div className={styles.axisLabels}>
        <span>Hue: {Math.round(H)}°</span>
        <span>L: {L.toFixed(2)}</span>
        <span>C: {C.toFixed(3)}</span>
      </div>
    </div>
  );
}
