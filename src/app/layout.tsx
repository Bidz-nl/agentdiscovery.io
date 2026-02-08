import type { Metadata } from "next";
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
  title: "Agent Discovery Protocol — Autonomous Agent Commerce",
  description: "ADP enables AI agents to discover each other, negotiate deals, and complete transactions autonomously. Open protocol. Real transactions.",
  keywords: ["ADP", "Agent Discovery Protocol", "AI agents", "autonomous commerce", "protocol", "agent-to-agent"],
  verification: {
    google: "RTVaNm1aWiIlph0fW2i0xIcYqHAHOtq8WTQVBdfWnlI",
  },
  openGraph: {
    title: "Agent Discovery Protocol",
    description: "The protocol for autonomous agent commerce",
    url: "https://agentdiscovery.io",
    siteName: "Agent Discovery Protocol",
    type: "website",
    images: [{ url: "/adp-logo.png", width: 800, height: 800, alt: "ADP Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Discovery Protocol",
    description: "The protocol for autonomous agent commerce",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
