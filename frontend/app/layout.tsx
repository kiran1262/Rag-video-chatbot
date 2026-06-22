import type { Metadata } from 'next'
import { Syne, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Reel Lab — Video Engagement Analyzer',
  description: 'Pit a YouTube video against an Instagram reel and get AI-powered engagement insights.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${hanken.variable}`}>
      <body className="bg-ink text-cream font-body antialiased grain">{children}</body>
    </html>
  )
}
