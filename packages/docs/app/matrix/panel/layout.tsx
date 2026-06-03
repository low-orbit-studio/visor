import type { Metadata } from "next";
import type { ReactNode } from "react";
// Pull private theme CSS into the matrix panel route so private-theme rows
// render with their real tokens (the all-themes matrix is the BL-227 driving
// use case). The generated file is an empty stub when no private package is
// installed, so this is a no-op for public clones.
import "./../../private-themes.generated.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MatrixPanelLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
