import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Music Bingo',
  description: 'Play bingo with AI-generated music cards!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://sdk.scdn.co/spotify-player.js"></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}