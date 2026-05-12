import type { Metadata } from 'next';
import type { ReactNode } from "react";
// Pull private theme CSS into the panel route so visual regression tests
// can snapshot private themes through `/compare/panel?theme=<slug>`. The
// generated file is an empty stub when no private package is installed.
import "./../../private-themes.generated.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
