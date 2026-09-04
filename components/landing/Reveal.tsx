"use client";
import { useEffect, useRef, useState } from "react";

/**
 * A restrained scroll-entrance wrapper — fades and slides up ~12px once an
 * element enters the viewport, then stops observing (a one-time reveal, not
 * a repeating scroll-jack effect).
 *
 * `visible` MUST start `false` unconditionally — reading `window` in the
 * state initializer (an earlier version of this file did, to satisfy
 * react-hooks/set-state-in-effect without an extra render) is exactly the
 * "server/client branch" anti-pattern that breaks SSR hydration parity:
 * caught live via a real console hydration-mismatch error, not just a lint
 * warning. All environment detection (prefers-reduced-motion, missing
 * IntersectionObserver support) belongs in the effect below, which only
 * ever runs post-hydration on the client.
 */
export function Reveal({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Staying visible is the safe default in both cases below — never a
    // crash (no IntersectionObserver) and never a permanently-hidden
    // element (reduced motion) — matching the values that any correct
    // client-only capability check would have already known here. These
    // checks are inherently client-only (window); computing them in the
    // state initializer instead breaks SSR hydration parity (see the
    // class doc comment above) rather than merely triggering this lint
    // rule's cascading-render concern.
    const skipObserving =
      typeof window.IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skipObserving) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
