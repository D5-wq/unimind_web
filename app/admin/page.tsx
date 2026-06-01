"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/dashboard/auth-context"
import { useRouter } from "next/navigation"
import {
  Users, FileText, Brain, TrendingUp, AlertTriangle,
  Sparkles, RefreshCw, Calendar, BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "yunjaehwang@gmail.com"
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "unimind2026"

interface Stats {
  totalUsers: number
  totalAnalyses: number
  newUsersThisWeek: number
  newAnalysesThisWeek: number
}

interface ConceptRow {
  concept_name: string
  count: number
  course_name?: string | null
}

interface CourseRow {
  course_name: string
  total: number
  confused: number
  confusion_rate: number
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [authed, setAuthed] = useState(false)
  const [pwInput, setPwInput] = useState("")
  const [pwError, setPwError] = useState(false)

  const [stats, setStats] = useState<Stats | null>(null)
  const [hardestConcepts, setHardestConcepts] = useState<ConceptRow[]>([])
  const [topConcepts, setTopConcepts] = useState<ConceptRow[]>([])
  const [hardestCourses, setHardestCourses] = useState<CourseRow[]>([])
  const [fetching, setFetching] = useState(false)
  const [lastFetched, setLastFetched] = useState<string | null>(null)

  // 세션에 인증 상태 저장
  useEffect(() => {
    const saved = sessionStorage.getItem("admin-authed")
    if (saved === "1") { setAuthed(true); fetchStats() }
  }, [])

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin-authed", "1")
      setAuthed(true)
      fetchStats()
    } else {
      setPwError(true)
      setTimeout(() => setPwError(false), 2000)
    }
  }

  const fetchStats = async () => {
    setFetching(true)
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

      // 1. 총 분석 수 & 이번 주 신규
      const [{ count: totalAnalyses }, { count: newAnalyses }] = await Promise.all([
        supabase.from("analyses").select("*", { count: "exact", head: true }),
        supabase.from("analyses").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      ])

      // 2. 총 사용자 수 (user_id 있는 것만)
      const { data: userRows } = await supabase
        .from("analyses")
        .select("user_id")
        .not("user_id", "is", null)

      const uniqueUsers = new Set(userRows?.map(r => r.user_id) ?? []).size

      const { data: newUserRows } = await supabase
        .from("analyses")
        .select("user_id")
        .not("user_id", "is", null)
        .gte("created_at", weekAgo)

      const newUniqueUsers = new Set(newUserRows?.map(r => r.user_id) ?? []).size

      setStats({
        totalUsers: uniqueUsers,
        totalAnalyses: totalAnalyses ?? 0,
        newUsersThisWeek: newUniqueUsers,
        newAnalysesThisWeek: newAnalyses ?? 0,
      })

      // 3. 가장 어려운 개념 TOP 10
      const { data: confusedData } = await supabase
        .from("concept_understanding")
        .select("concept_name, course_name")
        .eq("status", "confused")

      if (confusedData) {
        const map = new Map<string, { count: number; course_name: string | null }>()
        confusedData.forEach(row => {
          const k = row.concept_name
          map.set(k, { count: (map.get(k)?.count ?? 0) + 1, course_name: row.course_name })
        })
        setHardestConcepts(
          Array.from(map.entries())
            .map(([concept_name, { count, course_name }]) => ({ concept_name, count, course_name }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        )
      }

      // 4. 가장 많이 등장한 개념 TOP 10
      const { data: allConceptData } = await supabase
        .from("concept_understanding")
        .select("concept_name")

      if (allConceptData) {
        const map = new Map<string, number>()
        allConceptData.forEach(row => map.set(row.concept_name, (map.get(row.concept_name) ?? 0) + 1))
        setTopConcepts(
          Array.from(map.entries())
            .map(([concept_name, count]) => ({ concept_name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        )
      }

      // 5. 과목별 난이도
      const { data: courseData } = await supabase
        .from("concept_understanding")
        .select("course_name, status")
        .not("course_name", "is", null)

      if (courseData) {
        const map = new Map<string, { total: number; confused: number }>()
        courseData.forEach(row => {
          if (!row.course_name) return
          const curr = map.get(row.course_name) ?? { total: 0, confused: 0 }
          curr.total++
          if (row.status === "confused") curr.confused++
          map.set(row.course_name, curr)
        })
        setHardestCourses(
          Array.from(map.entries())
            .map(([course_name, { total, confused }]) => ({
              course_name,
              total,
              confused,
              confusion_rate: Math.round((confused / total) * 100),
            }))
            .filter(c => c.total >= 2)
            .sort((a, b) => b.confusion_rate - a.confusion_rate)
            .slice(0, 10)
        )
      }

      setLastFetched(new Date().toLocaleTimeString("ko-KR"))
    } catch (err) {
      console.error("[Admin] 통계 로드 실패:", err)
    } finally {
      setFetching(false)
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary mb-4">
              <BarChart3 className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">UniMind 관리자</h1>
            <p className="text-sm text-muted-foreground mt-1">비밀번호를 입력하세요</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={pwInput}
              onChange={e => setPwInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="관리자 비밀번호"
              className={`w-full rounded-xl border px-4 py-3 text-sm bg-card text-foreground outline-none transition-colors ${pwError ? "border-destructive" : "border-border focus:border-primary"}`}
              autoFocus
            />
            {pwError && <p className="text-xs text-destructive text-center">비밀번호가 틀렸어요</p>}
            <button
              onClick={handleLogin}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              입장
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              UniMind 관리자
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lastFetched ? `마지막 업데이트: ${lastFetched}` : "데이터 로딩 중..."}
            </p>
          </div>
          <Button
            onClick={fetchStats}
            disabled={fetching}
            variant="outline"
            className="rounded-xl gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", fetching && "animate-spin")} />
            새로고침
          </Button>
        </div>

        {/* 핵심 지표 */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                icon: Users, label: "총 사용자", value: stats.totalUsers,
                sub: `이번 주 +${stats.newUsersThisWeek}명`,
                color: "text-primary bg-primary/10",
                highlight: stats.newUsersThisWeek > 0,
              },
              {
                icon: FileText, label: "총 분석", value: stats.totalAnalyses,
                sub: `이번 주 +${stats.newAnalysesThisWeek}건`,
                color: "text-accent bg-accent/10",
                highlight: stats.newAnalysesThisWeek > 0,
              },
              {
                icon: Brain, label: "이해 체크 수", value: topConcepts.reduce((s, c) => s + c.count, 0),
                sub: `개념 ${topConcepts.length}종 집계됨`,
                color: "text-green-500 bg-green-500/10",
                highlight: false,
              },
              {
                icon: AlertTriangle, label: "총 헷갈림 수", value: hardestConcepts.reduce((s, c) => s + c.count, 0),
                sub: `${stats.totalAnalyses > 0 ? Math.round((hardestConcepts.reduce((s,c)=>s+c.count,0)/Math.max(topConcepts.reduce((s,c)=>s+c.count,0),1))*100) : 0}% 헷갈림률`,
                color: "text-destructive bg-destructive/10",
                highlight: false,
              },
            ].map(({ icon: Icon, label, value, sub, color, highlight }) => (
              <Card key={label} className={cn("rounded-2xl border-border shadow-sm", highlight && "border-primary/30")}>
                <CardContent className="p-5">
                  <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", color.split(" ")[1])}>
                    <Icon className={cn("h-5 w-5", color.split(" ")[0])} />
                  </div>
                  <p className="text-3xl font-black text-foreground">{value.toLocaleString()}</p>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 가장 어려운 개념 TOP 10 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                가장 어려운 개념 TOP 10
                <span className="text-xs font-normal text-muted-foreground">헷갈려요 체크 수</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hardestConcepts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
              ) : (
                <div className="space-y-2">
                  {hardestConcepts.map((c, i) => (
                    <div key={c.concept_name} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-muted-foreground text-right flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{c.concept_name}</span>
                          {c.course_name && (
                            <span className="text-[10px] text-muted-foreground bg-secondary rounded-md px-1.5 py-0.5 flex-shrink-0">
                              {c.course_name}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-destructive rounded-full"
                            style={{ width: `${Math.round((c.count / (hardestConcepts[0]?.count ?? 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-destructive flex-shrink-0">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 가장 많이 등장한 개념 TOP 10 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                가장 많이 등장한 개념 TOP 10
                <span className="text-xs font-normal text-muted-foreground">총 체크 수</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topConcepts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
              ) : (
                <div className="space-y-2">
                  {topConcepts.map((c, i) => (
                    <div key={c.concept_name} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-muted-foreground text-right flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">{c.concept_name}</span>
                        <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.round((c.count / (topConcepts[0]?.count ?? 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary flex-shrink-0">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 과목별 난이도 */}
          {hardestCourses.length > 0 && (
            <Card className="rounded-2xl border-border shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  과목별 헷갈림률
                  <span className="text-xs font-normal text-muted-foreground">높을수록 어려운 과목</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {hardestCourses.map(c => (
                    <div key={c.course_name} className="rounded-xl border border-border bg-secondary/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground truncate">{c.course_name}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-lg text-xs flex-shrink-0 ml-2",
                            c.confusion_rate >= 60 ? "bg-destructive/10 text-destructive border-destructive/20" :
                            c.confusion_rate >= 40 ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                            "bg-primary/10 text-primary border-primary/20"
                          )}
                        >
                          {c.confusion_rate}%
                        </Badge>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            c.confusion_rate >= 60 ? "bg-destructive" :
                            c.confusion_rate >= 40 ? "bg-orange-500" : "bg-primary"
                          )}
                          style={{ width: `${c.confusion_rate}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {c.total}개 체크 중 {c.confused}개 헷갈림
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 쿼리 참고 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Supabase SQL로 더 깊이 분석하기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-xl bg-secondary/50 p-4 text-xs text-muted-foreground overflow-x-auto leading-relaxed">
{`-- 어떤 개념에서 사람들이 가장 많이 막히는가?
SELECT concept_name, course_name,
  COUNT(*) FILTER (WHERE status='confused') AS confused,
  COUNT(*) FILTER (WHERE status='understood') AS understood,
  ROUND(AVG(CASE WHEN status='confused' THEN 1.0 ELSE 0 END)*100) AS confusion_pct
FROM concept_understanding
GROUP BY concept_name, course_name
ORDER BY confused DESC LIMIT 20;

-- 사용자별 이해도 (재방문율 추적)
SELECT user_id,
  COUNT(DISTINCT analysis_id) AS analyses,
  COUNT(*) FILTER (WHERE status='understood') AS understood,
  MIN(created_at)::date AS first_seen,
  MAX(updated_at)::date AS last_seen
FROM concept_understanding
WHERE user_id IS NOT NULL
GROUP BY user_id ORDER BY last_seen DESC;`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
