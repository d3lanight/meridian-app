// ━━━ Frontend Layout ━━━
// v0.4.0 · ca-story21 · 2026-02-15
// Meridian design system: fonts, globals, viewport

import type { Metadata } from "next";
import { Outfit, DM_Sans, DM_Mono } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Meridian",
  description: "Market & portfolio intelligence",
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${outfit.variable} ${dmSans.variable} ${dmMono.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
