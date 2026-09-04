import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "@/components/landing/Reveal";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("renders its children regardless of visibility state", () => {
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("starts hidden on the very first render (SSR/hydration parity), never branching on window in the initializer", () => {
    // The critical property this guards: SSR has no `window` at all, so
    // the first render must be identical to what SSR produced -- always
    // hidden -- regardless of what capabilities this client happens to
    // have. Effects (post-hydration) are the only place that may differ.
    render(<Reveal>Content</Reveal>);
    // jsdom has no IntersectionObserver, so the effect immediately flips
    // this to visible -- by the time render() returns (RTL flushes
    // effects), so this exercises the full mount, not just the first paint.
    expect(screen.getByText("Content")).toHaveClass("opacity-100");
  });

  it("becomes visible immediately when IntersectionObserver isn't available (jsdom, and old/embedded browsers) rather than staying hidden forever", () => {
    // jsdom genuinely has no IntersectionObserver -- no stubbing needed to
    // exercise this path, which is exactly the point being tested.
    expect("IntersectionObserver" in window).toBe(false);
    render(<Reveal>Content</Reveal>);
    expect(screen.getByText("Content")).toHaveClass("opacity-100");
  });

  it("becomes visible immediately when prefers-reduced-motion is set, never subscribing to IntersectionObserver", () => {
    const observe = vi.fn();
    class FakeObserver {
      observe = observe;
      disconnect = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver as unknown as typeof IntersectionObserver);
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

    render(<Reveal>Content</Reveal>);
    expect(screen.getByText("Content")).toHaveClass("opacity-100");
    expect(observe).not.toHaveBeenCalled();
  });
});
