"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, Brain, FileText, MessageSquare, Target, ArrowRight, Zap, CheckCircle, Flame, Crown, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function LandingPage() {
  const [loginLoading, setLoginLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoginLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const features = [
    { icon: FileText, title: "PDF/PPTX 분석", desc: "강의 자료를 업로드하면 AI가 즉시 핵심을 뽑아냅니다" },
    { icon: Brain, title: "핵심 개념 추출", desc: "중요한 개념을 자동으로 정리하고 이해도를 체크합니다" },
    { icon: Target, title: "AI 퀴즈 생성", desc: "개념 기반 OX·4지선다 문제가 자동으로 만들어집니다" },
    { icon: MessageSquare, title: "AI 질문 답변", desc: "헷갈리는 개념은 AI에게 바로 물어보세요" },
  ]

  const stats = [
    { value: "8초", label: "평균 분석 시간" },
    { value: "∞", label: "퀴즈 문제" },
    { value: "무료", label: "기본 사용" },
    { value: "100%", label: "AI 기반" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-6 md:px-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">UniMind</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" className="rounded-xl text-sm">둘러보기</Button>
          </Link>
          <Button
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="rounded-xl gap-2 text-sm"
          >
            {loginLoading ? (
              <Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google로 시작하기
          </Button>
        </div>
      </header>

      {/* 히어로 */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Zap className="h-3.5 w-3.5" />
          AI 기반 강의 학습 도우미
        </div>
        <h1 className="mb-4 text-4xl md:text-5xl font-bold leading-tight tracking-tight text-foreground">
          강의 자료 올리면<br />
          <span className="text-primary">AI가 공부를 대신 정리해줘요</span>
        </h1>
        <p className="mb-8 max-w-lg text-lg text-muted-foreground">
          PDF·PPTX 업로드 → 개념 정리 → 퀴즈 자동 생성.<br />
          시험 전날 밤새우는 일 없애드립니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <Button size="lg" className="rounded-xl px-8 gap-2 h-12" onClick={handleGoogleLogin} disabled={loginLoading}>
            {loginLoading ? <Sparkles className="h-5 w-5 animate-pulse" /> : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google로 무료 시작
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="rounded-xl px-8 h-12">
              로그인 없이 둘러보기 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">신용카드 불필요 · 월 5회 분석 무료</p>

        {/* 스탯 */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="rounded-2xl border border-border bg-card px-6 py-4 text-center">
              <p className="text-2xl font-black text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 기능 */}
      <section className="px-4 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-3">공부하는 방식을 바꿔드려요</h2>
          <p className="text-muted-foreground">업로드 한 번으로 4가지 학습 도구가 자동으로 생성됩니다</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 flex items-start gap-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 스트릭 섹션 */}
      <section className="px-4 py-16 bg-primary/5 border-y border-primary/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-4">🔥</div>
          <h2 className="text-2xl font-bold text-foreground mb-3">매일 퀴즈로 스트릭을 쌓아보세요</h2>
          <p className="text-muted-foreground mb-6">
            오늘 퀴즈를 풀면 스트릭 +1. 연속 학습이 쌓일수록 성적도 올라가요.
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${day <= 5 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {day <= 5 ? "🔥" : day}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro CTA */}
      <section className="px-4 py-20 max-w-2xl mx-auto text-center">
        <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-3">더 필요하다면 Pro로</h2>
        <p className="text-muted-foreground mb-6">
          무제한 분석, 오답 노트, PDF 내보내기.<br />
          한 달 커피 2잔 가격으로 성적을 올려보세요.
        </p>
        <Link href="/dashboard/pricing">
          <Button variant="outline" className="rounded-xl px-8 gap-2">
            <Crown className="h-4 w-4" />
            요금제 보기
          </Button>
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">UniMind</span>
        </div>
        <p>AI 학습 어시스턴트 · 대학생을 위한 공부 도구</p>
      </footer>
    </div>
  )
}
