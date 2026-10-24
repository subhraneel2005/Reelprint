import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PwaRegister } from "@/components/PwaRegister";
import { ToastProvider } from "@/components/ToastProvider";
import { libraryStats } from "@/lib/db";
import { cn } from "cn";
import { GeistSans } from 'geist/font/sans';


export const dynamic = "force-dynamic";


const description =
  "Save short videos, extract the ideas worth stealing, and turn them into scripts you can shoot today.";

export const metadata: Metadata = {
  title: {
    default: "Reelprint — turn reels into filmable ideas",
    template: "%s · Reelprint",
  },
  description,
  applicationName: "Reelprint",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Reelprint",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Reelprint",
    description,
    type: "website",
    siteName: "Reelprint",
  },
  twitter: {
    card: "summary",
    title: "Reelprint",
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0397FE",
  colorScheme: "light",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stats = libraryStats();

  return (
    <html lang="en">
      <body className={cn("min-h-dvh bg-background text-foreground", GeistSans.className)}>
        <ToastProvider>
          <AppShell stats={stats}>{children}</AppShell>
          <PwaRegister />
          <InstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
