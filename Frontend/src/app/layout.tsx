import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { PWAInitializer } from "@/components/pwa-initializer";

// Stand-in font configs to prevent fetching external Google Fonts in offline/sandboxed build environments.
const inter = { variable: "var(--font-inter, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" };
const geistMono = { variable: "var(--font-geist-mono, monospace)" };

export const metadata: Metadata = {
  title: "OASIS — Encuentra tu oasis de salud",
  description: "Plataforma de salud digital: citas médicas, recetas electrónicas, farmacia a domicilio y más. Tu refugio de calma y salud.",
  manifest: "/manifest.json",
  keywords: ["OASIS", "salud", "clínica", "farmacia", "citas médicas", "recetas", "telemedicina", "oasis de salud"],
  authors: [{ name: "OASIS" }],
  openGraph: {
    title: "OASIS — Encuentra tu oasis de salud",
    description: "Tu refugio digital de calma, claridad y salud",
    siteName: "OASIS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OASIS — Encuentra tu oasis de salud",
    description: "Tu refugio digital de calma, claridad y salud",
  },
};

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { BetaFeedback } from "@/components/common/BetaFeedback";
import { NotificationBanner } from "@/components/NotificationBanner";
import { FamilyProvider } from "@/contexts/FamilyContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <FamilyProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </FamilyProvider>
            <Toaster />
            <BetaFeedback />
            <PWAInitializer />
            <NotificationBanner />
          </QueryProvider>
        </ThemeProvider>

        {/* Register Service Worker and Global ChunkLoadError resilience */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global ChunkLoadError resiliency interceptor
              window.addEventListener('error', function(e) {
                const message = e.message || '';
                const isChunkError = message.indexOf('ChunkLoadError') !== -1 || 
                                     message.indexOf('Loading chunk') !== -1 ||
                                     (e.target && (e.target.src || '').indexOf('_next/static/chunks/') !== -1);
                if (isChunkError) {
                  console.warn('OASIS: Dynamic chunk load failed. Auto-reloading to fetch active production deployment...');
                  window.location.reload();
                }
              }, true);

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('OASIS: ServiceWorker registered successfully:', registration.scope);
                      // Force checking for updates immediately on every reload
                      registration.update().catch(function(e) {
                        console.debug('OASIS: ServiceWorker update check deferred:', e.message);
                      });
                    },
                    function(err) {
                      console.log('OASIS: ServiceWorker registration failed:', err);
                    }
                  );
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
