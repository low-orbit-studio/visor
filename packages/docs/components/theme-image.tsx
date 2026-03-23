"use client";

import { useTheme } from "next-themes";
import Image, { type ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface ThemeImageProps extends Omit<ImageProps, "src"> {
  srcDark: string;
  srcLight: string;
}

export function ThemeImage({ srcDark, srcLight, ...props }: ThemeImageProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before mount, render dark version to avoid flash (matches SSR default)
  const src = mounted && resolvedTheme !== "dark" ? srcLight : srcDark;

  return <Image {...props} src={src} />;
}
