"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  VisorThemeConfig,
  ThemeData,
} from "@loworbitstudio/visor-theme-engine";
import {
  generateThemeDataFromConfig,
  validate,
} from "@loworbitstudio/visor-theme-engine";
import type { ThemeValidationResult } from "@loworbitstudio/visor-theme-engine";

const DEFAULT_CONFIG: VisorThemeConfig = {
  name: "custom",
  version: 1,
  colors: {
    primary: "#6366F1",
    accent: "#F59E0B",
  },
};

export interface UseThemeCreatorReturn {
  config: VisorThemeConfig;
  themeData: ThemeData | null;
  validationResult: ThemeValidationResult | null;
  updateConfig: (path: string, value: unknown) => void;
  replaceConfig: (config: VisorThemeConfig) => void;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const clone = structuredClone(obj);
  const keys = path.split(".");
  let current: Record<string, unknown> = clone;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      current[key] === undefined ||
      current[key] === null ||
      typeof current[key] !== "object"
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return clone;
}

export function useThemeCreator(
  initialConfig?: VisorThemeConfig
): UseThemeCreatorReturn {
  const [config, setConfig] = useState<VisorThemeConfig>(
    initialConfig ?? DEFAULT_CONFIG
  );
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [validationResult, setValidationResult] =
    useState<ThemeValidationResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPipeline = useCallback((cfg: VisorThemeConfig) => {
    try {
      const data = generateThemeDataFromConfig(cfg);
      setThemeData(data);
    } catch {
      setThemeData(null);
    }

    try {
      const result = validate(cfg);
      setValidationResult(result);
    } catch {
      setValidationResult(null);
    }
  }, []);

  // Run pipeline on initial mount and config changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runPipeline(config);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [config, runPipeline]);

  const updateConfig = useCallback((path: string, value: unknown) => {
    setConfig(
      (prev) => setNestedValue(prev as unknown as Record<string, unknown>, path, value) as unknown as VisorThemeConfig
    );
  }, []);

  const replaceConfig = useCallback((newConfig: VisorThemeConfig) => {
    setConfig(newConfig);
  }, []);

  return { config, themeData, validationResult, updateConfig, replaceConfig };
}
