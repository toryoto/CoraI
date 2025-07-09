import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CoraI',
  description: 'AI-powered coral reef research assistant',
  icons: {
    icon: '/favicon/corai-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <head>
          <link rel="icon" href="/corai-icon.png" />
        </head>
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
