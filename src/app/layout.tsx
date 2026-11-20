import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shubh Vashisht — Software Engineer",
  description:
    "Full-stack and AI engineer building products at the intersection of robotics, language models, and developer tools.",
  openGraph: {
    title: "Shubh Vashisht — Software Engineer",
    description:
      "Full-stack and AI engineer building products at the intersection of robotics, language models, and developer tools.",
    type: "website",
  },
};

/** viewport-fit=cover lets the phone shell use the full screen and pad itself with safe-area insets. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101218",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
