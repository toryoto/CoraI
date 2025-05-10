import React from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  icons: {
    icon: '/corai-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="jp">
        <body className={inter.className}>
          <TooltipProvider>
            <NavBar />
            <main className="container mx-auto py-4 px-2">{children}</main>
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}