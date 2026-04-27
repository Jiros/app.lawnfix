import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LawnFix',
  description: 'Lawn diagnosis and repair — photograph your lawn for instant AI advice.',
  applicationName: 'LawnFix',
  icons: {
    icon: [
      { url: '/favicon.ico',    type: 'image/x-icon' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon-180.png', sizes: '180x180' },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LawnFix',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,        // prevent accidental zoom on inputs
  userScalable: false,
  viewportFit: 'cover',   // edge-to-edge on notched phones
  themeColor: '#15803d',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {/* Centre a max-width app shell on desktop; full-width on mobile */}
        <div className="mx-auto max-w-app min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
