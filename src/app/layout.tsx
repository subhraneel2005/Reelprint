import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { libraryStats } from "@/lib/db";

export const dynamic = "force-dynamic";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reelprint — a research desk for short-form",
  description:
    "Send a Reel or Short, get the transcript, the structure, live outliers, and ten ideas you can film.",
  applicationName: "Reelprint",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#eceef0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const stats = libraryStats();
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${plex.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell stats={stats}>{children}</AppShell>
      </body>
    </html>
  );
}
