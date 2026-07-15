import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ServiceWorkerRegister } from "./sw-register";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cancel Vulture — Take Back Your Money",
  description: "Find wasteful subscriptions, see their true long-term cost, and build a smarter cancellation plan.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: {
    title: "Cancel Vulture — Pick Apart Your Subscriptions",
    description: "See the damage. Pick the bones. Take back your money.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Cancel Vulture cutting a subscription receipt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cancel Vulture — Pick Apart Your Subscriptions",
    description: "See the damage. Pick the bones. Take back your money.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = { themeColor: "#050505", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={geist.variable}>{children}<ServiceWorkerRegister /></body></html>;
}
