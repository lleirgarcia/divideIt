import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { StructuredData } from '@/components/StructuredData';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'divideIt - Video Splitter for Social Media',
    template: '%s | divideIt',
  },
  description: 'Split your videos into random segments for Reels, TikTok, and YouTube Shorts. Upload MP4 or MOV files and create engaging short-form content instantly.',
  keywords: ['video splitter', 'video editor', 'reels', 'tiktok', 'youtube shorts', 'video segments', 'social media'],
  authors: [{ name: 'divideIt Team' }],
  creator: 'divideIt',
  publisher: 'divideIt',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'divideIt - Video Splitter for Social Media',
    description: 'Split your videos into random segments for Reels, TikTok, and YouTube Shorts',
    siteName: 'divideIt',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'divideIt - Video Splitter for Social Media',
    description: 'Split your videos into random segments for Reels, TikTok, and YouTube Shorts',
    creator: '@divideit',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0284c7" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <StructuredData />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
