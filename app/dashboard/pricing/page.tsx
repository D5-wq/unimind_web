"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { useAuth } from "@/components/dashboard/auth-context"
import {
  Sparkles, Check, Zap, Crown, ArrowRight, Loader2,
  Brain, Target, MessageSquare, FileText, Download, History,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const FREE_FEATURES = [
  { icon: FileText, text: "월 5회 강의 분석" },
  { icon: Brain, text: "핵심 개념 추출" },
  { icon: Target, text: "퀴즈 자동 생성" },
  { icon: MessageSquare, text: "AI 채팅" },
]

const PRO_FEATURES = [
  { icon: FileText, text: "무제한 강의 분석", highlight: true },
  { icon: Brain, text: "핵심 개념 추출" },
  { icon: Target, text: "퀴즈 자동 생성" },
  { icon: MessageSquare, text: "AI 채팅" },
  { icon: History, text: "퀴즈 기록 & 오답 노트", highlight: true },
  { icon: Download, text: "분석 결과 PDF 내보내기", highlight: true },
  { icon: Zap, text: "GPT-4o (최신 모델)", highlight: true },
  { icon: Crown, text: "Pro 뱃지 & 우선 지원", highlight: true },
]

export default function PricingPage() {
  const { user, signInWithGoogle, isPro } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    if (!user) {
      await signInWithGoogle()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      if (data.url) window.location.href = data.url
    } catch {
      setError("오류가 발생했어요. 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="요금제" subtitle="나에게 맞는 플랜을 선택하세요" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">

          {/* 상단 헤드라인 */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              유니버시티 학생을 위한 AI 학습 도구
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              더 많이 공부할수록<br />
              <span className="text-primary">Pro의 가치를 느껴요</span>
            </h2>
            <p className="text-muted-foreground">
              무료로 시작해보고, 부족하다 느낄 때 업그레이드하세요.
            </p>
          </div>

          {/* 플랜 카드 */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">

            {/* Free */}
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5">
                  <p className="text-sm font-medium text-muted-foreground mb-1">무료</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-foreground">0</span>
                    <span className="text-xl font-bold text-foreground mb-1">원</span>
                    <span className="text-sm text-muted-foreground mb-1">/월</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">시작하기에 충분해요</p>
                </div>

                <div className="space-y-3 mb-6">
                  {FREE_FEATURES.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                        <Check className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-foreground">{text}</span>
                    </div>
                  ))}
                </div>

                {!user ? (
                  <Button variant="outline" className="w-full rounded-xl" onClick={signInWithGoogle}>
                    Google로 무료 시작
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full rounded-xl" disabled>
                    현재 플랜
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="rounded-2xl border-primary/40 shadow-lg relative overflow-hidden">
              {/* 인기 뱃지 */}
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground rounded-lg text-xs px-2.5">
                  🔥 인기
                </Badge>
              </div>

              <CardContent className="p-6">
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-primary">Pro</p>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-foreground">4,900</span>
                    <span className="text-xl font-bold text-foreground mb-1">원</span>
                    <span className="text-sm text-muted-foreground mb-1">/월</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">한 달 커피 2잔 가격으로 성적 올리기</p>
                </div>

                <div className="space-y-3 mb-6">
                  {PRO_FEATURES.map(({ icon: Icon, text, highlight }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                        highlight ? "bg-primary" : "bg-secondary"
                      )}>
                        <Check className={cn("h-3 w-3", highlight ? "text-primary-foreground" : "text-muted-foreground")} />
                      </div>
                      <span className={cn("text-sm", highlight ? "font-medium text-foreground" : "text-foreground")}>{text}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-destructive mb-3 text-center">{error}</p>
                )}

                {isPro ? (
                  <Button className="w-full rounded-xl" disabled>
                    <Crown className="mr-2 h-4 w-4" />
                    이미 Pro 사용 중
                  </Button>
                ) : (
                  <Button onClick={handleUpgrade} disabled={loading} className="w-full rounded-xl gap-2">
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> 연결 중...</>
                    ) : (
                      <><Crown className="h-4 w-4" /> {user ? "Pro로 업그레이드" : "Google로 시작 후 업그레이드"} <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-border bg-secondary/20 p-6">
            <h3 className="font-semibold text-foreground mb-4">자주 묻는 질문</h3>
            <div className="space-y-4">
              {[
                { q: "무료 플랜은 어디까지 쓸 수 있나요?", a: "매월 5개 강의를 분석하고, 퀴즈·채팅·개념 맵 등 모든 기능을 사용할 수 있어요. 5개를 다 쓰면 다음 달 초에 리셋됩니다." },
                { q: "언제든 취소할 수 있나요?", a: "네, 언제든 취소 가능합니다. 취소해도 결제 기간이 남아있는 동안은 Pro 기능을 계속 쓸 수 있어요." },
                { q: "학생 할인이 있나요?", a: "지금은 별도 학생 할인은 없지만, Pro 요금 자체를 최대한 저렴하게 설정했어요." },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p className="text-sm font-medium text-foreground mb-1">{q}</p>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
