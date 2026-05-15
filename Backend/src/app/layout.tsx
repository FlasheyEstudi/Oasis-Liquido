import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OASIS – Intelligent Pharmacy Management System",
  description: "Revolutionary AI-powered pharmacy management platform. Smart inventory, prescription validation, delivery tracking, and clinical analytics — all in one place.",
  keywords: ["OASIS", "pharmacy", "healthcare", "management", "AI", "prescription", "inventory", "analytics"],
  authors: [{ name: "OASIS Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "OASIS – Intelligent Pharmacy Management System",
    description: "Revolutionary AI-powered pharmacy management platform for modern healthcare.",
    siteName: "OASIS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OASIS – Intelligent Pharmacy Management",
    description: "AI-powered pharmacy operations, simplified.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
