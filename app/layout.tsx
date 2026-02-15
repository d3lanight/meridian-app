// ━━━ Root Layout ━━━
// v0.4.0 · ca-story21 · 2026-02-15
// Bare pass-through — each route group provides its own html/body

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
