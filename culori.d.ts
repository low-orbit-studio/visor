declare module "culori" {
  export function parse(color: string): unknown;
  export function formatHex(color: unknown): string;
  export function wcagContrast(color1: unknown, color2: unknown): number;
  export function oklch(color: unknown): { l: number; c: number; h: number } | undefined;
  export function interpolate(colors: unknown[], mode?: string): (t: number) => unknown;
}
