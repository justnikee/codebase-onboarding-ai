import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { AppHeader } from "@/components/AppHeader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DevBoard | AI Developer Onboarding",
  description:
    "Intelligent repository analysis and onboarding powered by IBM watsonx",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(inter.variable, "font-sans dark")}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
        <NextAuthProvider>
          <AppHeader />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
