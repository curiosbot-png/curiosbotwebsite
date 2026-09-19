import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE } from "@/lib/site";

// Fonts are self-hosted (OFL-licensed Poppins + Open Sans, Latin subset): no third-party font requests for visitors.
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/poppins-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/poppins-latin-700-normal.woff2", weight: "700" },
  ], variable: "--font-poppins", display: "swap",
});
const openSans = localFont({
  src: [
    { path: "./fonts/open-sans-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/open-sans-latin-600-normal.woff2", weight: "600" },
  ], variable: "--font-open-sans", display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Curiosbot — Turn AI into business value", template: "%s | Curiosbot" },
  description: "Curiosbot helps enterprises identify, implement and scale AI and enterprise technology — AI strategy, PLM and Salesforce — that create measurable business impact.",
  openGraph: { type: "website", siteName: "Curiosbot", locale: "en_GB" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "./" },
};
export const viewport: Viewport = { themeColor: "#070614", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
