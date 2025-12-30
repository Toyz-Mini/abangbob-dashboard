import * as Sentry from '@sentry/nextjs';
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { SpeedInsights } from "@vercel/speed-insights/next"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta'
})

export function generateMetadata(): Metadata {
  return {
    title: 'AbangBob Dashboard - F&B Management System',
    description: 'Centralized Dashboard for F&B Business - POS, Inventory, HR & Accounting',
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'AbangBob',
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: 'website',
      siteName: 'AbangBob Dashboard',
      title: 'AbangBob Dashboard - F&B Management System',
      description: 'Centralized Dashboard for F&B Business - POS, Inventory, HR & Accounting',
    },
    twitter: {
      card: 'summary',
      title: 'AbangBob Dashboard',
      description: 'F&B Management System',
    },
    other: {
      ...Sentry.getTraceData()
    }
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d9488' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ms" suppressHydrationWarning className={plusJakartaSans.variable}>
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AbangBob" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0d9488" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        <Providers>
          {children}
          <SpeedInsights />
        </Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
