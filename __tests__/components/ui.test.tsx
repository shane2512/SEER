/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Status } from "@/components/ui/Status";

describe("UI primitives", () => {
  it("Button renders its label and responds to disabled", () => {
    render(<Button disabled>Execute</Button>);
    expect(screen.getByRole("button", { name: "Execute" })).toBeDisabled();
  });

  it("Badge renders its tone-specific text", () => {
    render(<Badge tone="bullish">BULLISH</Badge>);
    expect(screen.getByText("BULLISH")).toBeInTheDocument();
  });

  it("Status renders a labeled state", () => {
    render(<Status state="confirmed" />);
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
  });
});
