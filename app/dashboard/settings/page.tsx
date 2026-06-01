"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { useAuth } from "@/components/dashboard/auth-context"
import { useAnalysis } from "@/components/dashboard/analysis-context"
import { getStreak, getStreakEmoji } from "@/lib/streak"
import { getReviewSummary } from "@/lib/spaced-repetition"
import { getUsageCount, FREE_ANALYSIS_LIMIT } from "@/lib/stripe"
import { supabase } from "@/lib/supabase"
import {
  User, LogOut, Crown, Brain, Target, RotateCcw,
  Flame, BookOpen, CheckCheck, TrendingUp, Share2, ExternalLink, AlertTriangle,
} from "lucide-react"

interface WeakConcept {
  concept_name: string
  confused_count: number
  total_count: number
  file_name: string | null
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function SettingsPage() {
  const { user, signInWithGoogle, signOut, isPro } = useAuth()
  const { allAnalyses } = useAnalysis()

  const [streak, setStreak] = useState({ current: 0, longest: 0, totalQuizzes: 0 })
  const [reviewSummary, setReviewSummary] = useState({ total: 0, dueToday: 0, mastered: 0 })
  const [usageCount, setUsageCount] = useState(0)
  const [understanding, setUnderstanding] = useState({ understood: 0, confused: 0, total: 0 })
  const [weakConcepts, setWeakConcepts] = useState<WeakConcept[]>([])

  useEffect(() => {
    try { const s = getStreak(); setStreak({ current: s.current, longest: s.longest, totalQuizzes: s.totalQuizzes }) } catch {}
    try { setReviewSummary(getReviewSummary()) } catch {}
    try { setUsageCount(getUsageCount()) } catch {}

    // DB에서 내 취약 개념 집계 (로그인 사용자만)
    if (user?.id) {
      supabase
        .from("concept_understanding")
        .select("concept_name, status, file_name")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (!data) return
          // concept별 집계
          const map = new Map<string, WeakConcept>()
          data.forEach(row => {
            const key = row.concept_name
            if (!map.has(key)) {
              map.set(key, { concept_name: key, confused_count: 0, total_count: 0, file_name: row.file_name })
            }
            const entry = map.get(key)!
            entry.total_count++
            if (row.status === "confused") entry.confused_count++
          })
          const sorted = Array.from(map.values())
            .filter(c => c.confused_count > 0)
            .sort((a, b) => b.confused_count - a.confused_count)
            .slice(0, 5)
          setWeakConcepts(sorted)
        })
        .catch(() => {})
    }

    // 전체 이해도 집계
    try {
      let understood = 0, confused = 0, total = 0
      Object.keys(localStorage)
        .filter(k => k.startsWith("concept-understanding-"))
        .forEach(k => {
          const data = JSON.parse(localStorage.getItem(k) ?? "{}")
          Object.values(data).forEach((v: any) => {
            total++
            if (v === "understood") understood++
            else if (v === "confused") confused++
          })
        })
      setUnderstanding({ understood, confused, total })
    } catch {}
  }, [])

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "사용자"
  const avatarUrl = user?.user_metadata?.avatar_url

  // 이해도 %
  const understandingPct = understanding.total > 0
    ? Math.round((understanding.understood / understanding.total) * 100)
    : 0

  // 총 개념 수
  const totalConcepts = allAnalyses.reduce((sum, a) => {
    try {
      const data = JSON.parse(localStorage.getItem(`analysis-${a.id}`) ?? "{}")
      return sum + (data.concepts?.length ?? 0)
    } catch { return sum }
  }, 0)

  const stats = [
    {
      icon: BookOpen,
      label: "분석한 강의",
      value: `${allAnalyses.length}개`,
      sub: "총 업로드 수",
      color: "text-primary bg-primary/10",
    },
    {
      icon: Brain,
      label: "누적 개념",
      value: `${totalConcepts}개`,
      sub: "모든 강의 합산",
      color: "text-accent bg-accent/10",
    },
    {
      icon: CheckCheck,
      label: "이해 완료",
      value: `${understanding.understood}개`,
      sub: `전체 이해도 ${understandingPct}%`,
      color: "text-green-500 bg-green-500/10",
    },
    {
      icon: RotateCcw,
      label: "복습 마스터",
      value: `${reviewSummary.mastered}개`,
      sub: `총 ${reviewSummary.total}개 등록`,
      color: "text-orange-500 bg-orange-500/10",
    },
    {
      icon: Target,
      label: "총 퀴즈",
      value: `${streak.totalQuizzes}회`,
      sub: "완료한 퀴즈 수",
      color: "text-destructive bg-destructive/10",
    },
    {
      icon: Flame,
      label: "최장 스트릭",
      value: `${streak.longest}일`,
      sub: `현재 ${streak.current}일 연속`,
      color: "text-orange-400 bg-orange-400/10",
    },
  ]

  return (
    <div className="flex flex-col">
      <Header title="마이페이지" subtitle="나의 학습 기록과 현황" />
      <div className="flex-1 space-y-6 p-6">

        {/* 프로필 카드 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              {/* 아바타 */}
              {user ? (
                avatarUrl
                  ? <img src={avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover flex-shrink-0" />
                  : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary border border-border">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-foreground">{user ? displayName : "비로그인 사용자"}</h2>
                  {isPro && (
                    <Badge className="rounded-lg bg-primary/10 text-primary border-primary/20 gap-1">
                      <Crown className="h-3 w-3" /> Pro
                    </Badge>
                  )}
                  {streak.current >= 7 && (
                    <Badge variant="outline" className="rounded-lg bg-orange-500/10 text-orange-500 border-orange-500/20">
                      {getStreakEmoji(streak.current)} {streak.current}일 스트릭
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{user?.email ?? "로그인하면 데이터가 클라우드에 저장됩니다"}</p>

                {!user ? (
                  <Button onClick={signInWithGoogle} className="mt-3 rounded-xl gap-2" size="sm">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google로 로그인
                  </Button>
                ) : (
                  <Button onClick={signOut} variant="outline" className="mt-3 rounded-xl gap-2 text-muted-foreground" size="sm">
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                )}
              </div>

              {/* 플랜 정보 */}
              <div className={cn(
                "flex-shrink-0 rounded-2xl border px-5 py-4 text-center hidden sm:block",
                isPro ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"
              )}>
                {isPro
                  ? <><Crown className="h-5 w-5 text-primary mx-auto mb-1" /><p className="text-sm font-bold text-primary">Pro</p><p className="text-xs text-muted-foreground">무제한 분석</p></>
                  : <><BookOpen className="h-5 w-5 text-muted-foreground mx-auto mb-1" /><p className="text-sm font-bold text-foreground">{usageCount} / {FREE_ANALYSIS_LIMIT}</p><p className="text-xs text-muted-foreground">이번 달 분석</p><Link href="/dashboard/pricing"><p className="text-xs text-primary mt-1 hover:underline">업그레이드 →</p></Link></>
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 학습 통계 */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">학습 통계</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {stats.map(({ icon: Icon, label, value, sub, color }) => (
              <Card key={label} className="rounded-2xl border-border shadow-sm">
                <CardContent className="p-4">
                  <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", color.split(" ")[1])}>
                    <Icon className={cn("h-4 w-4", color.split(" ")[0])} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 이해도 진행 바 */}
        {understanding.total > 0 && (
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                전체 이해도
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${understandingPct}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-foreground w-12 text-right">{understandingPct}%</span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  이해 {understanding.understood}개
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  복습 필요 {understanding.confused}개
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-secondary border border-border" />
                  미체크 {understanding.total - understanding.understood - understanding.confused}개
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 취약 개념 Top 5 — DB 기반 */}
        {weakConcepts.length > 0 && (
          <Card className="rounded-2xl border-orange-500/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                내 취약 개념 Top {weakConcepts.length}
                <span className="text-xs font-normal text-muted-foreground ml-1">헷갈려요 체크 기준</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weakConcepts.map((c, i) => {
                const confusedPct = Math.round((c.confused_count / c.total_count) * 100)
                return (
                  <div key={c.concept_name} className="flex items-center gap-3 rounded-xl bg-secondary/30 p-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-500">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.concept_name}</p>
                      {c.file_name && (
                        <p className="text-xs text-muted-foreground truncate">{c.file_name.replace(/\.[^.]+$/, "")}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-orange-500">{confusedPct}%</p>
                      <p className="text-xs text-muted-foreground">헷갈림</p>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground text-center pt-1">
                이 개념들을 집중 복습해보세요
              </p>
            </CardContent>
          </Card>
        )}

        {/* 최근 분석 강의 */}
        {allAnalyses.length > 0 && (
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  분석한 강의 ({allAnalyses.length}개)
                </CardTitle>
                <Link href="/dashboard/knowledge">
                  <Button variant="ghost" size="sm" className="rounded-xl text-xs text-primary gap-1">
                    지식 그래프 <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {allAnalyses.map(a => (
                  <Link key={a.id} href={`/dashboard/analysis?id=${a.id}`}>
                    <div className="flex items-center gap-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 p-3 transition-colors">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.fileName}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.oneLiner}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={e => {
                            e.preventDefault()
                            navigator.clipboard.writeText(`${window.location.origin}/share/${a.id}`)
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="공유 링크 복사"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
