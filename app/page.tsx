"use client"

import Link from "next/link"
import { Sparkles, Brain, FileText, MessageSquare, Target, ArrowRight, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const features = [
    { icon: FileText, title: "PDF/PPTX 분석", desc: "강의 자료를 업로드하면 AI가 즉시 분석합니다" },
    { icon: Brain, title: "핵심 개념 추출", desc: "중요한 개념을 자동으로 정리해드립니다" },
    { icon: Target, title: "시험 포인트 예측", desc: "시험에 나올 가능성 높은 내용을 예측합니다" },
    { icon: MessageSquare, title: "AI 질문 답변", desc: "강의 내용에 대해 무엇이든 물어보세요" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">UniMind</span>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-xl">대시보드 바로가기</Button>
        </Link>
      </header>

      <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Zap className="h-3.5 w-3.5" />
          AI 기반 강의 학습 도우미
        </div>
        <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight text-foreground">
          AI가 강의 이해를 도와주는<br />
          <span className="text-primary">나만의 학습 어시스턴트</span>
        </h1>
        <p className="mb-8 max-w-lg text-lg text-muted-foreground">
          강의 자료를 업로드하면 AI가 핵심 개념을 정리하고<br />시험을 대비해 줄 수 있어요.
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="rounded-xl px-10">
            시작하기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        <div className="mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-5">
          {["무료 사용", "설치 불필요", "AI 자동 분석", "시험 포인트 예측"].map(b => (
            <div key={b} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              {b}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
