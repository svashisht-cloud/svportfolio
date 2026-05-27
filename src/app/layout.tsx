import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { kode_mono } from "./fonts";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kode_mono.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
