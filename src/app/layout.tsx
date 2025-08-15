import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Music Bingo - Play with Spotify',
  description: 'Play bingo with AI-generated music cards powered by Spotify Premium. Mobile-optimized music gaming experience.',
  keywords: 'music bingo, AI, Spotify, game, mobile, premium',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1db954'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AI Music Bingo" />
        <script src="https://sdk.scdn.co/spotify-player.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onSpotifyWebPlaybackSDKReady = () => {
                console.log('Spotify Web Playback SDK is ready');
                // SDK is ready, but we'll initialize it in the component when needed
              };
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}