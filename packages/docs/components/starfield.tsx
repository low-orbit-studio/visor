"use client";

import { useState, useEffect } from "react";

const STAR_COUNT = 130;

interface StarData {
  size: number;
  left: number;
  top: number;
  duration: number;
  maxOpacity: number;
  delay: number;
}

function generateStars(): StarData[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    size: Math.random() * 2 + 0.5,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 2 + Math.random() * 5,
    maxOpacity: 0.2 + Math.random() * 0.7,
    delay: Math.random() * 5,
  }));
}

export function Starfield() {
  const [stars, setStars] = useState<StarData[] | null>(null);

  useEffect(() => {
    setStars(generateStars());
  }, []);

  if (!stars) return <div className="starfield" />;

  return (
    <div className="starfield">
      {stars.map((star, i) => (
        <div
          key={i}
          className="star"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.left}%`,
            top: `${star.top}%`,
            "--d": `${star.duration}s`,
            "--o": star.maxOpacity,
            animationDelay: `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
