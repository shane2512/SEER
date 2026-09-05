"use client";
import { useEffect, useRef } from "react";

/**
 * Wraps the execution-pipeline steps and publishes how far the reader has
 * scrolled through them as `--progress` (0..1), which the vertical rail
 * consumes as a `scaleY`.
 *
 * This is the one scroll-scrubbed effect on the page, and it is here because
 * the pipeline is the only content that is genuinely a *sequence* — the rail
 * filling as you descend encodes real information (how far through the four
 * checkpoints you are). Applying the same treatment to the parallel feature
 * list above would be decoration, so it is not applied there.
 *
 * Progress is measured against the container's own travel through the
 * viewport, and clamped, so the rail is empty before the section arrives and
 * full once its last step has been read.
 */
export function PipelineRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // With reduced motion the rail is drawn complete rather than left empty:
    // an unfilled rail would read as a broken or still-loading element.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.setProperty("--progress", "1");
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      // Start filling when the section's top reaches 80% of the viewport
      // height, finish when its bottom passes 40% — so the rail completes as
      // the last step lands in the reading zone, not after it has left.
      const start = window.innerHeight * 0.8;
      const end = window.innerHeight * 0.4;
      const travelled = start - rect.top;
      const total = rect.height + start - end;
      const progress = Math.min(1, Math.max(0, travelled / total));
      node.style.setProperty("--progress", progress.toFixed(4));
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
  }, []);

  return (
    <div ref={ref} className="relative" style={{ ["--progress" as string]: "0" }}>
      {/* Track and fill are separate elements so the fill can scale on the
          compositor while the track stays a static hairline. */}
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-[11px] w-px bg-border-layer sm:left-[15px]"
      />
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-[11px] w-px origin-top bg-text-bright/70 sm:left-[15px]"
        style={{ transform: "scaleY(var(--progress))", willChange: "transform" }}
      />
      {children}
    </div>
  );
}
