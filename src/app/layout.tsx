import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
    images: [{ url: "/images/og-adp.png", width: 1200, height: 630, alt: "Agent Discovery Protocol - Autonomous Agent Commerce" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Discovery Protocol",
    description: "The protocol for autonomous agent commerce",
    images: ["/images/og-adp.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8EGSV1DV67"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8EGSV1DV67');
          `}
        </Script>
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="4aJGuAcz6ix7G8UcxYaQQw"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
