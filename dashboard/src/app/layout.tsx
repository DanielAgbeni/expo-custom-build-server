import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import Providers from '@/components/providers'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'UploadDoc Expo Server',
  description:
    'Self-hosted Android build service for Expo projects. Seamlessly queue, build, and download APKs for your applications natively. Elevate your development pipeline.',
  keywords: ['Expo', 'Android', 'Build Service', 'React Native', 'APK', 'UploadDoc'],
  openGraph: {
    title: 'UploadDoc Expo Server',
    description: 'Self-hosted Android build service for Expo projects. Seamlessly queue, build, and download APKs for your applications natively.',
    type: 'website',
    siteName: 'UploadDoc Expo Server',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UploadDoc Expo Server',
    description: 'Self-hosted Android build service for Expo projects. Seamlessly queue, build, and download APKs.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
