"use client";
import { useEffect, useRef } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Translates its children vertically as the page scrolls, at a fraction of
 * the scroll rate, producing depth separation between the atmosphere layer
 * and the content sitting on top of it.
 *
 * Written against `transform` only — never `top`/`margin` — so the effect
 * stays on the compositor and never triggers layout during a scroll. Reads
 * are batched into a rAF callback rather than run inline in the scroll
 * handler, which is what keeps `getBoundingClientRect` from forcing a
 * synchronous reflow on every scroll event.
 */
export function Parallax({
  children,
  speed = 0.15,
  className = "",
}: {
  children: React.ReactNode;
  /** Fraction of scroll distance to translate by. Negative moves against the scroll. */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia(REDUCED).matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      // Distance of the element's centre from the viewport's centre. Zero at
      // the moment the element is perfectly centred, so the untranslated
      // position is the one the layout was designed around.
      const fromCentre = rect.top + rect.height / 2 - window.innerHeight / 2;
      node.style.transform = `translate3d(0, ${(-fromCentre * speed).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

/**
 * Publishes the pointer's position within this element as `--px` / `--py`
 * (each in the range -1..1, origin at the element's centre) for descendants
 * to consume in `transform` or gradient positions.
 *
 * Gated on a fine pointer, so it never runs on touch devices where there is
 * no hover state to respond to and the listener would be pure cost. Also
 * gated on reduced motion. The value eases toward the pointer rather than
 * tracking it exactly — raw tracking reads as twitchy and cheap, whereas a
 * damped follow reads as weight.
 */
export function PointerField({
  children,
  className = "",
  strength = 1,
}: {
  children: React.ReactNode;
  className?: string;
  /** Multiplier on the published -1..1 range. */
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia(REDUCED).matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const tick = () => {
      // Critically-damped-ish follow: close 8% of the remaining gap per frame.
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      node.style.setProperty("--px", (currentX * strength).toFixed(4));
      node.style.setProperty("--py", (currentY * strength).toFixed(4));

      // Stop the loop once the pointer target is effectively reached, and
      // restart it on the next move, rather than burning a frame forever.
      if (Math.abs(targetX - currentX) > 0.0005 || Math.abs(targetY - currentY) > 0.0005) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width - 0.5;
      targetY = (event.clientY - rect.top) / rect.height - 0.5;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
