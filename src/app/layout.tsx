import type { Metadata } from "next";
import localFont from "next/font/local";
import { wedding } from "@/config/wedding";
import { Suspense } from "react";
import WeddingLive from "@/components/wedding-live";
import "./globals.css";

const bodyFont = localFont({
  src: "../../public/fonts/quicksand.ttf",
  variable: "--font-body",
  display: "swap",
  weight: "300 700",
});

const displayFont = localFont({
  src: [
    { path: "../../public/fonts/cormorant-garamond.ttf", style: "normal", weight: "300 700" },
    { path: "../../public/fonts/cormorant-garamond-italic.ttf", style: "italic", weight: "300 700" },
  ],
  variable: "--font-display",
  display: "swap",
});

const scriptFont = localFont({
  src: "../../public/fonts/great-vibes.ttf",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: wedding.metadata.title,
  description: wedding.metadata.description,
  openGraph: {
    title: wedding.metadata.openGraph.title,
    description: wedding.metadata.openGraph.description,
    locale: wedding.metadata.openGraph.locale,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${bodyFont.variable} ${displayFont.variable} ${scriptFont.variable}`}
    >
      <body><Suspense fallback={null}><WeddingLive audio>{children}</WeddingLive></Suspense></body>
    </html>
  );
}
