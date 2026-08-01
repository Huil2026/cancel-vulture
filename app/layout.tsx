import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "./analytics";
import { ServiceWorkerRegister } from "./sw-register";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cancel Vulture — Take Back Your Money",
  description: "Find wasteful subscriptions, see their true long-term cost, and build a smarter cancellation plan.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/cancel-vulture-icon.png", shortcut: "/cancel-vulture-icon.png", apple: "/cancel-vulture-icon.png" },
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
  return (
    <html lang="en">
      <body className={geist.variable}>
        {children}
        <ServiceWorkerRegister />
        <GoogleAnalytics />
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xsktlxsem4");
          `}
        </Script>
      </body>
    </html>
  );
}
