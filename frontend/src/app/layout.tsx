import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";
import { NextAuthProvider } from "@/components/NextAuthProvider";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'DevBoard | AI Developer Onboarding',
  description: 'Intelligent repository analysis and onboarding powered by IBM watsonx',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans dark", inter.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
