import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'UniMind — AI 강의 학습 어시스턴트',
    template: '%s | UniMind',
  },
  description: 'PDF·PPTX 업로드 한 번으로 핵심 개념 정리, 퀴즈 자동 생성, 약점 복습, 시험 점수 예측까지. 대학생을 위한 AI 학습 코치.',
  metadataBase: new URL('https://unimind-web.vercel.app'),
  keywords: ['AI 학습', '대학생 공부', 'PDF 요약', 'AI 퀴즈', '강의 정리', '시험 준비', '개념 정리', 'UniMind'],
  authors: [{ name: 'UniMind' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'UniMind — AI 강의 학습 어시스턴트',
    description: 'PDF 업로드 한 번으로 핵심 개념 정리, 퀴즈 자동 생성, 시험 점수 예측까지.',
    siteName: 'UniMind',
    type: 'website',
    url: 'https://unimind-web.vercel.app',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniMind — AI 강의 학습 어시스턴트',
    description: 'PDF 업로드 한 번으로 핵심 개념 정리, 퀴즈 자동 생성, 시험 점수 예측까지.',
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
