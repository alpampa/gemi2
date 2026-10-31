import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { NotificationContainer } from "@/components/ui/NotificationToast";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { ReducedMotionProvider } from "@/components/providers/ReducedMotionProvider";
import { DARK_THEME_IDS, DEFAULT_THEME_ID, THEME_STORAGE_KEY } from "@/lib/theme-ids";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vapur Seferleri — İstanbul Deniz Ulaşımı",
  description: "İstanbul Şehir Hatları, Mavi Marmara ve Prens Tur güncel vapur kalkış panosu, iptal duyuruları ve deniz hava durumu.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Vapur",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // WCAG 1.4.4: Yakınlaştırma engellenmez. iOS'ta odakta yakınlaşmayı önlemek
  // için input font-size 16px kuralı globals.css'te uygulanır (maximum-scale hack'i DEĞİL).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var key = ${JSON.stringify(THEME_STORAGE_KEY)};
                var darkIds = ${JSON.stringify(DARK_THEME_IDS)};
                var themeId = ${JSON.stringify(DEFAULT_THEME_ID)};
                var raw = localStorage.getItem(key);
                if (raw) {
                  var parsed = JSON.parse(raw);
                  if (parsed && parsed.state && parsed.state.theme) {
                    themeId = parsed.state.theme;
                  }
                }
                var root = document.documentElement;
                root.setAttribute('data-theme', themeId);
                if (darkIds.indexOf(themeId) !== -1) {
                  root.classList.add('dark');
                } else {
                  root.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-slate-100 dark:bg-[#070b14] text-slate-900 dark:text-white min-h-[100dvh] touch-pan-y pb-[env(safe-area-inset-bottom)] transition-colors duration-150">
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        <ReducedMotionProvider>
          <ServiceWorkerRegister />
          {children}
          <NotificationContainer />
        </ReducedMotionProvider>
      </body>
    </html>
  );
}
