import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { GlassShell } from "@/components/GlassShell";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skillster — Profil finden",
  description:
    "Privates, bildgestütztes Profiling für Orientierung im Jobcoaching.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Skillster",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07111c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-dvh antialiased">
        <GlassShell>{children}</GlassShell>
      </body>
    </html>
  );
}
