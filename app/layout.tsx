// ━━━ Root Layout ━━━
// v0.5.0 · ca-story76 · 2026-02-28
// Next.js 16 requires html/body in root layout
// Fonts loaded here to avoid hydration mismatch
import "./globals.css";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${dmSans.variable} ${dmMono.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
