"use client";

import { useState, useEffect } from "react";
import { Starfield } from "./starfield";

export function ConditionalStarfield() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function check() {
      setVisible(document.body.classList.contains("space-theme"));
    }

    check();
    document.addEventListener("visor-theme-change", check);
    return () => document.removeEventListener("visor-theme-change", check);
  }, []);

  if (!visible) return null;
  return <Starfield />;
}
