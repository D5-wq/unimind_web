"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Users, FileText, Brain, TrendingUp, AlertTriangle,
  Sparkles, RefreshCw, BarChart3, Repeat2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ── 타입 ───────────────────────────────────────── */
interface KPI {
  totalUsers: number
  totalAnalyses: number
  avgAnalysesPerUser: number
  retention7d: number  // 7일 재방문 사용자 수
}

interface ConceptRow { concept_name: string; count: number; course_name?: string | null }
interface CourseRow  { course_name: string; total: number; confused: number; rate: number }

/* ── 컴포넌트 ────────────────────────────────────── */
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pwInput, setPwInput] = useState("")
  const [pwError, setPwError] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [kpi, setKpi] = useState<KPI | null>(null)
  const [hardest, setHardest] = useState<ConceptRow[]>([])
  const [topConcepts, setTopConcepts] = useState<ConceptRow[]>([])
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [fetching, setFetching] = useState(false)
  const [lastFetched, setLastFetched] = useState<string | null>(null)

  // 세션 유지
  useEffect(() => {
    if (sessionStorage.getItem("admin-authed") === "1") {
      setAuthed(true)
      fetchStats()
    }
  }, [])

  /* ── 인증 (서버 API 경유 — 비밀번호 클라이언트 노출 없음) ── */
  const handleLogin = async () => {
    setVerifying(true)
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput }),
      })
      if (res.ok) {
        sessionStorage.setItem("admin-authed", "1")
        setAuthed(true)
        fetchStats()
      } else {
        setPwError(true)
        setTimeout(() => setPwError(false), 2000)
      }
    } finally {
      setVerifying(false)
    }
  }

  /* ── 통계 수집 ──────────────────────────────────── */
  const fetchStats = async () => {
    setFetching(true)
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

      // ── KPI ──────────────────────────────────────
      const [
        { count: totalAnalyses },
        { data: userRows },
        { data: returnRows },
      ] = await Promise.all([
        supabase.from("analyses").select("*", { count: "exact", head: true }),
        supabase.from("analyses").select("user_id").not("user_id", "is", null),
        // 7일 재방문: 가입일이 7일 이전이면서 최근 7일 내 분석 있는 user_id
        supabase.from("analyses").select("user_id, created_at").not("user_id", "is", null),
      ])

      const allUsers = new Set(userRows?.map(r => r.user_id) ?? [])
      const totalUsers = allUsers.size

      // 사용자당 평균 분석 수
      const perUser = totalUsers > 0 ? Math.round((totalAnalyses ?? 0) / totalUsers * 10) / 10 : 0

      // 7일 재방문: 첫 분석이 7일 이전이고 + 최근 7일 내 분석도 있는 유저
      const userFirstSeen = new Map<string, string>()
      const userLastSeen  = new Map<string, string>()
      returnRows?.forEach(r => {
        if (!r.user_id) return
        const prev = userFirstSeen.get(r.user_id)
        if (!prev || r.created_at < prev) userFirstSeen.set(r.user_id, r.created_at)
        const last = userLastSeen.get(r.user_id)
        if (!last || r.created_at > last) userLastSeen.set(r.user_id, r.created_at)
      })
      const retention7d = Array.from(allUsers).filter(uid => {
        const first = userFirstSeen.get(uid) ?? ""
        const last  = userLastSeen.get(uid) ?? ""
        return first < weekAgo && last >= weekAgo
      }).length

      setKpi({ totalUsers, totalAnalyses: totalAnalyses ?? 0, avgAnalysesPerUser: perUser, retention7d })

      // ── 개념 통계 ─────────────────────────────────
      const { data: cuData } = await supabase
        .from("concept_understanding")
        .select("concept_name, course_name, status")

      if (cuData) {
        // 헷갈림 top
        const confusedMap = new Map<string, { count: number; course_name: string | null }>()
        const totalMap    = new Map<string, number>()

        cuData.forEach(r => {
          totalMap.set(r.concept_name, (totalMap.get(r.concept_name) ?? 0) + 1)
          if (r.status === "confused") {
            confusedMap.set(r.concept_name, {
              count: (confusedMap.get(r.concept_name)?.count ?? 0) + 1,
              course_name: r.course_name,
            })
          }
        })

        setHardest(
          Array.from(confusedMap.entries())
            .map(([k, v]) => ({ concept_name: k, count: v.count, course_name: v.course_name }))
            .sort((a, b) => b.count - a.count).slice(0, 10)
        )
        setTopConcepts(
          Array.from(totalMap.entries())
            .map(([k, v]) => ({ concept_name: k, count: v }))
            .sort((a, b) => b.count - a.count).slice(0, 10)
        )

        // 과목별 헷갈림률
        const courseMap = new Map<string, { total: number; confused: number }>()
        cuData.forEach(r => {
          if (!r.course_name) return
          const c = courseMap.get(r.course_name) ?? { total: 0, confused: 0 }
          c.total++
          if (r.status === "confused") c.confused++
          courseMap.set(r.course_name, c)
        })
        setCourses(
          Array.from(courseMap.entries())
            .map(([k, v]) => ({ course_name: k, ...v, rate: Math.round(v.confused / v.total * 100) }))
            .filter(c => c.total >= 2)
            .sort((a, b) => b.rate - a.rate).slice(0, 8)
        )
      }

      setLastFetched(new Date().toLocaleTimeString("ko-KR"))
    } catch (err) {
      console.error("[Admin]", err)
    } finally {
      setFetching(false)
    }
  }

  /* ── 비밀번호 화면 ─────────────────────────────── */
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary mb-4">
              <BarChart3 className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">UniMind Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">관리자 비밀번호를 입력하세요</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={pwInput}
              onChange={e => setPwInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              autoFocus
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-sm bg-card text-foreground outline-none transition-colors",
                pwError ? "border-destructive" : "border-border focus:border-primary"
              )}
            />
            {pwError && <p className="text-xs text-destructive text-center">비밀번호가 틀렸어요</p>}
            <button
              onClick={handleLogin}
              disabled={verifying || !pwInput}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {verifying ? "확인 중..." : "입장"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── 대시보드 ────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              UniMind Admin
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lastFetched ? `업데이트: ${lastFetched}` : "로딩 중..."}
            </p>
          </div>
          <Button onClick={fetchStats} disabled={fetching} variant="outline" className="rounded-xl gap-2">
            <RefreshCw className={cn("h-4 w-4", fetching && "animate-spin")} />
            새로고침
          </Button>
        </div>

        {/* ── 핵심 KPI 4개 ── */}
        {kpi && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                {
                  icon: Users, label: "총 사용자", value: kpi.totalUsers,
                  color: "text-primary bg-primary/10",
                  note: "로그인 유저 기준",
                },
                {
                  icon: FileText, label: "총 분석 수", value: kpi.totalAnalyses,
                  color: "text-accent bg-accent/10",
                  note: "전체 누적",
                },
                {
                  icon: TrendingUp, label: "사용자당 평균", value: `${kpi.avgAnalysesPerUser}건`,
                  color: "text-green-500 bg-green-500/10",
                  note: "분석 수 / 사용자",
                },
                {
                  icon: Repeat2, label: "7일 재방문", value: kpi.retention7d,
                  color: kpi.retention7d > 0 ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground bg-secondary",
                  note: "명 재방문",
                },
              ].map(({ icon: Icon, label, value, color, note }) => (
                <Card key={label} className="rounded-2xl border-border shadow-sm">
                  <CardContent className="p-5">
                    <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", color.split(" ")[1])}>
                      <Icon className={cn("h-5 w-5", color.split(" ")[0])} />
                    </div>
                    <p className="text-3xl font-black text-foreground">{value}</p>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* KPI 해석 */}
            <div className="rounded-2xl border border-border bg-secondary/20 px-5 py-4">
              <p className="text-sm text-foreground font-medium mb-1">지금 상태 해석</p>
              <p className="text-sm text-muted-foreground">
                {kpi.totalUsers === 0
                  ? "아직 로그인 사용자가 없어요. Google OAuth 설정 후 친구 5명한테 써보게 해보세요."
                  : kpi.avgAnalysesPerUser >= 3
                  ? `사용자당 평균 ${kpi.avgAnalysesPerUser}건 — 꽤 잘 쓰고 있어요. 재방문율이 핵심입니다.`
                  : `사용자당 평균 ${kpi.avgAnalysesPerUser}건 — 첫 분석 후 이탈하는 사람이 많아요. 온보딩을 점검해보세요.`}
              </p>
            </div>
          </>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 가장 어려운 개념 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                가장 어려운 개념 TOP 10
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hardest.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
                : <div className="space-y-2">
                    {hardest.map((c, i) => (
                      <div key={c.concept_name} className="flex items-center gap-3">
                        <span className="w-4 text-xs text-muted-foreground text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-foreground truncate">{c.concept_name}</span>
                            {c.course_name && (
                              <span className="text-[10px] bg-secondary rounded px-1.5 py-0.5 text-muted-foreground flex-shrink-0">
                                {c.course_name}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-destructive rounded-full"
                              style={{ width: `${Math.round(c.count / hardest[0].count * 100)}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-destructive">{c.count}</span>
                      </div>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>

          {/* 가장 많이 등장한 개념 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-primary" />
                가장 많이 등장한 개념 TOP 10
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topConcepts.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
                : <div className="space-y-2">
                    {topConcepts.map((c, i) => (
                      <div key={c.concept_name} className="flex items-center gap-3">
                        <span className="w-4 text-xs text-muted-foreground text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-foreground truncate block">{c.concept_name}</span>
                          <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.round(c.count / topConcepts[0].count * 100)}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary">{c.count}</span>
                      </div>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>

          {/* 과목별 난이도 */}
          {courses.length > 0 && (
            <Card className="rounded-2xl border-border shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  과목별 헷갈림률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {courses.map(c => (
                    <div key={c.course_name} className="rounded-xl border border-border bg-secondary/30 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-foreground truncate">{c.course_name}</p>
                        <span className={cn("text-sm font-bold",
                          c.rate >= 60 ? "text-destructive" : c.rate >= 40 ? "text-orange-500" : "text-primary"
                        )}>{c.rate}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          c.rate >= 60 ? "bg-destructive" : c.rate >= 40 ? "bg-orange-500" : "bg-primary"
                        )} style={{ width: `${c.rate}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{c.total}개 체크</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* SQL 참고 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Supabase SQL 직접 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-xl bg-secondary/50 p-4 text-xs text-muted-foreground overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`-- 개념별 헷갈림률
SELECT concept_name, course_name,
  COUNT(*) FILTER (WHERE status='confused') AS confused,
  COUNT(*) TOTAL,
  ROUND(AVG(CASE WHEN status='confused' THEN 1.0 ELSE 0 END)*100) AS pct
FROM concept_understanding
GROUP BY concept_name, course_name
ORDER BY confused DESC LIMIT 20;

-- 7일 재방문 사용자
SELECT COUNT(DISTINCT user_id) AS retained
FROM analyses
WHERE user_id IN (
  SELECT user_id FROM analyses
  GROUP BY user_id HAVING MIN(created_at) < NOW() - INTERVAL '7 days'
) AND created_at > NOW() - INTERVAL '7 days';`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
