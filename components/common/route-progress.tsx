'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Pathname changed → start progress
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;

      // Clear any previous animation
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      setVisible(true);
      setWidth(0);

      // Animate to ~85% quickly, then stall
      rafRef.current = requestAnimationFrame(() => {
        setWidth(70);
        timerRef.current = setTimeout(() => setWidth(85), 300);
      });

      // Complete after a short delay
      timerRef.current = setTimeout(() => {
        setWidth(100);
        timerRef.current = setTimeout(() => setVisible(false), 300);
      }, 500);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-primary transition-all ease-out"
      style={{ width: `${width}%`, transitionDuration: width === 100 ? '200ms' : '400ms' }}
    />
  );
}
