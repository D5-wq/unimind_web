import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'UniMind — AI 강의 학습 어시스턴트',
  description: 'PDF·PPTX 업로드 한 번으로 핵심 개념 정리, 퀴즈 자동 생성, AI 질문까지. 대학생을 위한 AI 학습 도우미.',
  metadataBase: new URL('https://unimind-web.vercel.app'),
  openGraph: {
    title: 'UniMind — AI 강의 학습 어시스턴트',
    description: 'PDF·PPTX 업로드 한 번으로 핵심 개념 정리, 퀴즈 자동 생성, AI 질문까지.',
    siteName: 'UniMind',
    type: 'website',
    url: 'https://unimind-web.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniMind — AI 강의 학습 어시스턴트',
    description: 'PDF·PPTX 업로드 한 번으로 핵심 개념 정리, 퀴즈 자동 생성, AI 질문까지.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="bg-background">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
