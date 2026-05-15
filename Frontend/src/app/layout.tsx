import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OASIS — Encuentra tu oasis de salud",
  description: "Plataforma de salud digital: citas médicas, recetas electrónicas, farmacia a domicilio y más. Tu refugio de calma y salud.",
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
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
