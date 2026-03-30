import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ScrollToTop />
      </body>
    </html>
  );
}
