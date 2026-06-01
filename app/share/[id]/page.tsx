import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import {
  Sparkles, FileText, Brain, Target, AlertTriangle,
  ArrowRight, BookOpen,
} from "lucide-react"

interface Concept {
  name: string
  simple: string
  difficulty?: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

async function getAnalysis(id: string) {
  const { data, error } = await supabase
    .from("analyses")
    .select("id, file_name, one_liner, summary, flow, concepts, exam_points, created_at")
    .eq("id", id)
    .single()
  if (error || !data) return null
  return data
}

// ── 동적 OG 태그 ──────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getAnalysis(id)

  if (!data) {
    return {
      title: "UniMind — 강의를 찾을 수 없어요",
    }
  }

  const concepts = (data.concepts ?? []) as Concept[]
  const examPoints = (data.exam_points ?? []) as string[]
  const description = `핵심 개념 ${concepts.length}개 · 시험 포인트 ${examPoints.length}개 | ${data.summary ?? data.one_liner}`

  return {
    title: `${data.one_liner} — UniMind`,
    description,
    openGraph: {
      title: data.one_liner,
      description,
      siteName: "UniMind",
      type: "article",
      url: `https://unimind-web.vercel.app/share/${id}`,
      images: [
        {
          url: `https://unimind-web.vercel.app/og-default.png`,
          width: 1200,
          height: 630,
          alt: data.one_liner,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.one_liner,
      description,
      images: [`https://unimind-web.vercel.app/og-default.png`],
    },
  }
}
// ──────────────────────────────────────────────────────────

const DIFF_CLS = (d?: string) =>
  d === "심화" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
  d === "핵심" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                 "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"

export default async function SharePage({ params }: PageProps) {
  const { id } = await params
  const data = await getAnalysis(id)
  if (!data) notFound()

  const concepts = (data.concepts ?? []) as Concept[]
  const flow     = (data.flow ?? []) as string[]
  const examPoints = (data.exam_points ?? []) as string[]

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">UniMind</span>
          </Link>
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              나도 분석해보기
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">

        {/* 요약 카드 */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1 truncate">{data.file_name}</p>
              <p className="font-semibold text-foreground text-lg leading-snug">{data.one_liner}</p>
              {data.summary && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Brain className="h-3.5 w-3.5 text-primary" /> 개념 {concepts.length}개</span>
                <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5 text-destructive" /> 시험 포인트 {examPoints.length}개</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-accent" /> 흐름 {flow.length}단계</span>
              </div>
            </div>
          </div>
        </div>

        {/* 강의 흐름 */}
        {flow.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold text-foreground mb-4">
              <BookOpen className="h-4 w-4 text-primary" /> 강의 흐름
            </h2>
            <div className="space-y-2">
              {flow.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">{i + 1}</div>
                  <p className="text-sm text-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 핵심 개념 */}
        {concepts.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold text-foreground mb-4">
              <Brain className="h-4 w-4 text-primary" /> 핵심 개념 {concepts.length}개
            </h2>
            <div className="space-y-3">
              {concepts.map((concept, i) => (
                <div key={i} className="rounded-xl bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                    <span className="font-medium text-foreground text-sm">{concept.name}</span>
                    {concept.difficulty && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${DIFF_CLS(concept.difficulty)}`}>{concept.difficulty}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed ml-7">{concept.simple}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 시험 포인트 */}
        {examPoints.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold text-foreground mb-4">
              <AlertTriangle className="h-4 w-4 text-destructive" /> 예상 시험 포인트
            </h2>
            <div className="space-y-2">
              {examPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-destructive/5 border border-destructive/10 p-3">
                  <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${
                    i === 0 ? "bg-destructive/10 text-destructive" :
                    i === 1 ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
                  }`}>{i + 1}</div>
                  <p className="text-sm text-foreground leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary mb-4">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">내 강의도 AI로 분석해볼까요?</h3>
          <p className="text-sm text-muted-foreground mb-5">
            PDF·PPTX 업로드 → 핵심 개념 정리 → 퀴즈 자동 생성<br />
            무료로 월 5회, 로그인만 하면 바로 시작
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 무료 시작
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                먼저 둘러보기 <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">신용카드 불필요 · 설치 없음</p>
        </div>
      </main>
    </div>
  )
}

export const revalidate = 3600
