import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { SITE_NAME } from "@/lib/brand";
import { publicSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-MSC6DJ94C2";

export async function generateMetadata(): Promise<Metadata> {
  const origin = await publicSiteOrigin();
  return {
    metadataBase: new URL(origin),
    title: `${SITE_NAME} — Browser extension directory`,
    description: "Web Store Extensions — submit and discover browser extensions with community moderation.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {GA_ID ? (
        <>
          <Script
            id="ga-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      ) : null}
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ScrollToTop />
      </body>
    </html>
  );
}
