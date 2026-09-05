import type { Metadata } from "next";
import { Space_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteFooter } from "@/components/chrome/SiteFooter";

// Brutal-Clay design system (docs/superpowers/specs/2026-09-04-brutal-clay-design-system.md,
// extended by 2026-09-05-brutal-clay-motion-atmosphere.md): Space Mono for
// display/headline/labels, JetBrains Mono for tabular data and body. Both are
// load-bearing to the aesthetic, not decorative choices — every numeric column
// in the UI depends on JetBrains Mono's tabular figures for alignment, and the
// hero's display tier depends on Space Mono holding up at ~136px, which is why
// the 700 weight is loaded rather than synthesised.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SEER — Event Contract Intelligence",
  description:
    "An explainable trading agent for DreamDEX Event Contracts on Somnia testnet — live BTC/ETH markets, a deterministic decision engine, and on-chain execution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${spaceMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        {/* The atmosphere pair lives at the root so every surface sits in the
            same lit room. Both are fixed, aria-hidden and pointer-events-none;
            page content is lifted above them with `relative z-10`. */}
        <div className="atmos" aria-hidden />
        <div className="atmos-grain" aria-hidden />
        <Providers>
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
