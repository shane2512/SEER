import type { Metadata } from "next";
import { Space_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Terminal Brutalism design system (docs/superpowers/specs/2026-09-04-terminal-brutalism-design-system.md):
// Space Mono for display/headline/body, JetBrains Mono for tabular data and
// uppercase labels. Both are load-bearing to the aesthetic, not decorative
// choices — every numeric column in the UI depends on JetBrains Mono's
// tabular figures for column alignment.
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
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
