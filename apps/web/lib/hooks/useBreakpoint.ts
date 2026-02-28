"use client";

/**
 * useBreakpoint — Returns the current responsive mode.
 *
 * Uses window.matchMedia for efficient breakpoint detection.
 * Returns undefined during SSR for safe hydration.
 *
 * Breakpoints:
 *   desktop: > 1024px
 *   tablet:  769px–1024px
 *   mobile:  <= 768px
 */

import { useState, useEffect } from "react";

export type Breakpoint = "desktop" | "tablet" | "mobile";

export function useBreakpoint(): Breakpoint | undefined {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | undefined>(
    undefined
  );

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1025px)");
    const tabletQuery = window.matchMedia(
      "(min-width: 769px) and (max-width: 1024px)"
    );

    function update() {
      if (desktopQuery.matches) {
        setBreakpoint("desktop");
      } else if (tabletQuery.matches) {
        setBreakpoint("tablet");
      } else {
        setBreakpoint("mobile");
      }
    }

    // Set initial value
    update();

    // Listen for changes
    desktopQuery.addEventListener("change", update);
    tabletQuery.addEventListener("change", update);

    return () => {
      desktopQuery.removeEventListener("change", update);
      tabletQuery.removeEventListener("change", update);
    };
  }, []);

  return breakpoint;
}
