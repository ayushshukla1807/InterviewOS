'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeBackground() {
  const { theme } = useTheme();
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    if (theme === 'skynight') {
      const generateStars = () => {
        const newStars = [];
        for (let i = 0; i < 200; i++) {
          newStars.push({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 3 + 1}px`,
            delay: `${Math.random() * 5}s`,
            duration: `${Math.random() * 4 + 2}s`,
          });
        }
        setStars(newStars);
      };
      generateStars();
    }
  }, [theme]);

  if (theme === 'multicolor') {
    return (
      <div className="fixed inset-0 z-[-2] aurora-bg opacity-40 pointer-events-none" />
    );
  }

  if (theme === 'skynight') {
    return (
      <div className="fixed inset-0 z-[-2] bg-[#050510] overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              '--delay': star.delay,
              '--duration': star.duration,
            } as React.CSSProperties}
          />
        ))}
        {/* Subtle glowing nebula effect for skynight */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>
    );
  }

  return null;
}
