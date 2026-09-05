"use client";
import { useEffect, useRef } from "react";

/**
 * Sets `data-revealed="true"` on its element once it enters the viewport,
 * then stops observing. Every actual animation is expressed in CSS keyed off
 * that attribute (see `.line-mask` in globals.css), so this component holds
 * no React state at all.
 *
 * That is deliberate, not incidental. The previous reveal primitive
 * (components/landing/Reveal.tsx) drove visibility through `useState`, which
 * forced a `setState`-in-effect suppression and had already caused one real
 * SSR hydration mismatch when an earlier version tried to read `window` in
 * the state initializer to avoid it. Writing an attribute on a ref sidesteps
 * the whole class of problem: the server and the client render identical
 * markup, and the reveal is a post-hydration DOM mutation rather than a
 * render.
 *
 * Reduced motion is handled entirely in CSS (a `prefers-reduced-motion` block
 * resolves masked content to its final state), so there is no capability
 * check here and no path where content stays permanently hidden.
 */
export function InView({
  children,
  className = "",
  threshold = 0.2,
  immediate = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  /** Fraction of the element that must be visible before revealing. */
  threshold?: number;
  /** Reveal on mount instead of on scroll — for above-the-fold content. */
  immediate?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reveal = () => node.setAttribute("data-revealed", "true");

    if (immediate || typeof window.IntersectionObserver === "undefined") {
      // A frame's delay lets the browser paint the pre-reveal state first, so
      // the hero animates in rather than being already-finished on first paint.
      const frame = requestAnimationFrame(reveal);
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate, threshold]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * One masked line inside an `InView`. The content sits translated fully below
 * its own clipping box and rises into place, so the type reads as being
 * uncovered rather than fading in — a better fit for a system that presents
 * itself as an instrument readout than a generic opacity transition.
 *
 * `delay` is what sequences a multi-line headline into a single choreographed
 * moment instead of several simultaneous ones.
 */
export function Line({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <span className="line-mask">
      <span className={className} style={{ transitionDelay: `${delay}ms` }}>
        {children}
      </span>
    </span>
  );
}

/**
 * The same entrance as `Line`, without the clipping box.
 *
 * `Line` works by hiding its content behind `overflow: hidden`, which would
 * also clip the focus ring of anything focusable inside it — a button
 * revealed that way is keyboard-focusable but its focus indicator is
 * invisible. So interactive elements use this instead: it fades and rises
 * with the same curve and duration, so the two read as one choreographed
 * sequence, but nothing is clipped.
 */
export function Rise({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={`rise ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
