import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Posthi — Plan, schedule, and post smarter.',
    template: '%s | Posthi',
  },
  description:
    'Posthi is a private-first social media scheduling tool. Plan, bulk schedule, and auto-post content to X/Twitter and Instagram with ease.',
  keywords: ['social media scheduler', 'X scheduler', 'Instagram scheduler', 'bulk schedule', 'content calendar'],
  openGraph: {
    title: 'Posthi — Plan, schedule, and post smarter.',
    description: 'A private-first social media scheduler for X/Twitter and Instagram.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'Posthi',
  },
  robots: {
    index: false, // Private app — keep off search engines
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
