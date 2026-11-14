import localFont from "next/font/local";
import Script from "next/script";
import { Suspense } from "react";
import WeddingLive from "@/components/wedding-live";
import "./globals.css";
import "./portrait-layout.css";

const bodyFont = localFont({
  src: "../../public/fonts/quicksand.ttf",
  variable: "--font-quicksand",
  display: "swap",
  weight: "300 700",
});

const displayFont = localFont({
  src: [
    { path: "../../public/fonts/cormorant-garamond.ttf", style: "normal", weight: "300 700" },
    { path: "../../public/fonts/cormorant-garamond-italic.ttf", style: "italic", weight: "300 700" },
  ],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

const scriptFont = localFont({
  src: "../../public/fonts/great-vibes.ttf",
  variable: "--font-great-vibes",
  display: "swap",
});

// Added 2026-11-13: expose the remaining bundled fonts to live editing without preloading unused families.
const vietnameseFont = localFont({ src: "../../public/fonts/be-vietnam-pro.ttf", variable: "--font-be-vietnam-pro", display: "swap", preload: false });
const loraFont = localFont({ src: [{ path: "../../public/fonts/lora.ttf", style: "normal" }, { path: "../../public/fonts/lora-italic.ttf", style: "italic" }], variable: "--font-lora", display: "swap", preload: false });
const charmonmanFont = localFont({ src: "../../public/fonts/charmonman-bold.ttf", weight: "700", variable: "--font-charmonman", display: "swap", preload: false });

export { getWeddingMetadata as generateMetadata } from "@/lib/wedding-server";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${bodyFont.variable} ${displayFont.variable} ${scriptFont.variable} ${vietnameseFont.variable} ${loraFont.variable} ${charmonmanFont.variable}`}
    >
      <body>
        <Script id="wedding-scroll-reset" strategy="beforeInteractive">{`
          if (!location.pathname.startsWith("/admin")) {
            history.scrollRestoration = "manual";
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          }
        `}</Script>
        <Suspense fallback={null}><WeddingLive audio>{children}</WeddingLive></Suspense>
      </body>
    </html>
  );
}
