"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { useAnalysis } from "@/components/dashboard/analysis-context"
import { useAuth } from "@/components/dashboard/auth-context"
import {
  Upload, FileText, Presentation, X, CheckCircle, Loader2, Sparkles, File, AlertCircle,
  Crown, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getUsageCount, incrementUsage, FREE_ANALYSIS_LIMIT } from "@/lib/stripe"
import { logEvent, EVENTS } from "@/lib/events"
import { STORAGE_KEYS, storageGet, storageSet } from "@/lib/storage"
import Link from "next/link"

async function extractTextFromFile(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.pptx')) {
    const JSZip = (await import('jszip')).default
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const na = parseInt(a.match(/(\d+)/)?.[1] ?? '0')
        const nb = parseInt(b.match(/(\d+)/)?.[1] ?? '0')
        return na - nb
      })
    const texts: string[] = []
    for (const slideFile of slideFiles) {
      const xml = await zip.files[slideFile].async('text')
      const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? []
      const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim()
      if (slideText) texts.push(slideText)
    }
    return texts.join('\n')
  } else {
    const { extractText } = await import('unpdf')
    const buffer = new Uint8Array(await file.arrayBuffer())
    const { text } = await extractText(buffer, { mergePages: true })
    return text as string
  }
}

interface UploadedFile {
  id: string
  name: string
  size: number
  status: "uploading" | "analyzing" | "complete" | "error"
  progress: number
  result?: any
  supabaseId?: string
}

const STEPS = [
  { label: "텍스트 추출 중", duration: 1200 },
  { label: "핵심 개념 발견 중", duration: 2500 },
  { label: "강의 흐름 분석 중", duration: 2000 },
  { label: "시험 포인트 추출 중", duration: 1800 },
  { label: "퀴즈 문제 생성 중", duration: 2000 },
  { label: "예상 점수 계산 중", duration: 1500 },
]

function AnalyzingSteps() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState<number[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let cur = 0
    const advance = () => {
      if (cur >= STEPS.length - 1) return
      timerRef.current = setTimeout(() => {
        setDone(prev => [...prev, cur])
        cur++
        setStep(cur)
        advance()
      }, STEPS[cur].duration)
    }
    advance()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4 space-y-2">
      {STEPS.map((s, i) => {
        const isDone = done.includes(i)
        const isCurrent = step === i
        return (
          <div key={i} className={cn("flex items-center gap-3 text-sm transition-opacity duration-300", i > step + 1 ? "opacity-30" : "opacity-100")}>
            <div className={cn(
              "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all",
              isDone ? "bg-green-500 text-white" :
              isCurrent ? "bg-primary text-primary-foreground animate-pulse" :
              "bg-secondary border border-border text-muted-foreground"
            )}>
              {isDone ? "✓" : i + 1}
            </div>
            <span className={cn(
              "transition-colors",
              isDone ? "text-muted-foreground line-through" :
              isCurrent ? "text-foreground font-medium" :
              "text-muted-foreground"
            )}>
              {s.label}
            </span>
            {isCurrent && <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse ml-auto" />}
          </div>
        )
      })}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showLimit, setShowLimit] = useState(false)
  const router = useRouter()
  const { reload, select } = useAnalysis()
  const { isPro, user } = useAuth()

  const usageCount = getUsageCount()
  const isLimitReached = !isPro && usageCount >= FREE_ANALYSIS_LIMIT

  const analyzeFile = async (file: File, id: string) => {
    // Pro가 아닐 때 한도 체크
    if (!isPro && getUsageCount() >= FREE_ANALYSIS_LIMIT) {
      setShowLimit(true)
      setFiles(prev => prev.filter(f => f.id !== id))
      return
    }

    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "uploading", progress: 20 } : f))
    logEvent(EVENTS.PDF_UPLOADED, { fileName: file.name, fileSize: file.size }, user?.id)

    try {
      const text = await extractTextFromFile(file)
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "analyzing", progress: 60 } : f))

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 8000), fileName: file.name, userId: user?.id ?? null }),
      })

      const result = await res.json()
      const storageId = result.supabaseId ?? id

      // 분석 성공 → 사용량 증가 + 이벤트 기록
      incrementUsage()
      logEvent(EVENTS.ANALYSIS_COMPLETE, { fileName: file.name, supabaseId: result.supabaseId }, user?.id)

      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, status: "complete", progress: 100, result, supabaseId: result.supabaseId } : f
      ))

      storageSet(STORAGE_KEYS.analysis(storageId), result)
      storageSet(STORAGE_KEYS.analysisMeta(storageId), { fileName: file.name, name: file.name, uploadedAt: Date.now() })

      await reload()
      select(storageId)

      const prevNotifs = storageGet<any[]>(STORAGE_KEYS.notifications, [])
      prevNotifs.unshift({
        id: `notif-${storageId}`,
        analysisId: storageId,
        title: file.name,
        oneLiner: result.oneLiner ?? "",
        timestamp: Date.now(),
        read: false,
      })
      storageSet(STORAGE_KEYS.notifications, prevNotifs.slice(0, 20))

    } catch (err) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "error" } : f))
    }
  }

  const handleFiles = (fileList: FileList) => {
    if (isLimitReached) { setShowLimit(true); return }

    const newFiles: UploadedFile[] = Array.from(fileList).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
    }))

    setFiles(prev => [...newFiles, ...prev])
    Array.from(fileList).forEach((file, index) => {
      analyzeFile(file, newFiles[index].id)
    })
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files)
  }, [isLimitReached])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading": return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      case "analyzing": return <Sparkles className="h-5 w-5 animate-pulse text-accent" />
      case "complete":  return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":     return <AlertCircle className="h-5 w-5 text-destructive" />
    }
  }

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading": return "업로드 중..."
      case "analyzing": return "AI 분석 중..."
      case "complete":  return "분석 완료"
      case "error":     return "오류 발생"
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="강의 자료 업로드" subtitle="PDF 또는 PPTX를 업로드하고 AI 분석을 시작하세요" />

      <div className="flex-1 space-y-6 p-6">

        {/* 사용량 표시 (무료 유저만) */}
        {!isPro && (
          <div className={cn(
            "flex items-center justify-between rounded-2xl border px-4 py-3",
            isLimitReached
              ? "border-destructive/30 bg-destructive/5"
              : usageCount >= FREE_ANALYSIS_LIMIT - 1
              ? "border-orange-500/30 bg-orange-500/5"
              : "border-border bg-secondary/30"
          )}>
            <div className="flex items-center gap-3">
              {isLimitReached
                ? <Lock className="h-4 w-4 text-destructive" />
                : <FileText className="h-4 w-4 text-muted-foreground" />}
              <div>
                <p className={cn("text-sm font-medium", isLimitReached ? "text-destructive" : "text-foreground")}>
                  이번 달 분석 {usageCount} / {FREE_ANALYSIS_LIMIT}회 사용
                </p>
                {isLimitReached && (
                  <p className="text-xs text-destructive/80">한도에 도달했어요. Pro로 업그레이드하면 무제한 분석 가능해요.</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5">
                {Array.from({ length: FREE_ANALYSIS_LIMIT }).map((_, i) => (
                  <div key={i} className={cn(
                    "h-2 w-5 rounded-full transition-colors",
                    i < usageCount
                      ? isLimitReached ? "bg-destructive" : "bg-primary"
                      : "bg-secondary border border-border"
                  )} />
                ))}
              </div>
              {isLimitReached && (
                <Link href="/dashboard/pricing">
                  <Button size="sm" className="rounded-xl gap-1.5 flex-shrink-0">
                    <Crown className="h-3.5 w-3.5" />
                    Pro 업그레이드
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 한도 초과 모달 */}
        {showLimit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLimit(false)}>
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-destructive/10 mb-4">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-center text-foreground mb-2">이번 달 한도 초과</h2>
              <p className="text-sm text-center text-muted-foreground mb-6">
                무료 플랜은 월 {FREE_ANALYSIS_LIMIT}회 분석까지 가능해요.<br />
                Pro로 업그레이드하면 무제한으로 분석할 수 있어요.
              </p>
              <div className="space-y-2">
                <Link href="/dashboard/pricing" className="block">
                  <Button className="w-full rounded-xl gap-2">
                    <Crown className="h-4 w-4" />
                    Pro로 업그레이드 (월 4,900원)
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full rounded-xl" onClick={() => setShowLimit(false)}>
                  다음 달에 쓸게요
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 업로드 드롭존 */}
        <Card className={cn(
          "rounded-2xl border-2 border-dashed transition-all duration-300",
          isLimitReached ? "border-border opacity-50 pointer-events-none" :
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}>
          <CardContent className="p-0">
            <div
              className="flex flex-col items-center justify-center py-16"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={cn(
                "mb-6 rounded-2xl p-6 transition-all duration-300",
                isDragging ? "bg-primary/10 scale-110" : "bg-secondary/50"
              )}>
                {isLimitReached
                  ? <Lock className="h-12 w-12 text-muted-foreground" />
                  : <Upload className={cn("h-12 w-12 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />}
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {isLimitReached ? "이번 달 한도에 도달했어요" : "강의 자료를 드래그하여 업로드"}
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                {isLimitReached ? "Pro로 업그레이드하면 무제한 분석 가능해요" : "PDF 또는 PPTX 파일을 선택하세요 (최대 50MB)"}
              </p>
              {isLimitReached ? (
                <Link href="/dashboard/pricing">
                  <Button className="rounded-xl px-8 gap-2">
                    <Crown className="h-4 w-4" />
                    Pro 업그레이드
                  </Button>
                </Link>
              ) : (
                <label>
                  <input type="file" accept=".pdf,.pptx" multiple className="hidden" onChange={handleFileInput} />
                  <Button className="rounded-xl px-8" asChild>
                    <span><File className="mr-2 h-4 w-4" />파일 선택</span>
                  </Button>
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 파일 목록 */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">업로드된 파일 ({files.length})</h3>
            <div className="space-y-3">
              {files.map((file) => (
                <Card key={file.id} className="rounded-2xl border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        {file.name.toLowerCase().endsWith('.pptx')
                          ? <Presentation className="h-6 w-6 text-primary" />
                          : <FileText className="h-6 w-6 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{file.name}</h4>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-2 text-sm">
                              {getStatusIcon(file.status)}
                              <span className={cn(
                                "text-sm",
                                file.status === "complete" ? "text-green-600" :
                                file.status === "error" ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {getStatusText(file.status)}
                              </span>
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => removeFile(file.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        {(file.status === "uploading" || file.status === "analyzing") && (
                          <Progress value={file.progress} className="mt-3 h-1.5" />
                        )}
                      </div>
                    </div>

                    {file.status === "analyzing" && (
                      <AnalyzingSteps />
                    )}

                    {file.status === "complete" && file.result && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground mb-1">✨ {file.result.oneLiner}</p>
                              <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                                {file.result.concepts?.length > 0 && (
                                  <span>핵심 개념 {file.result.concepts.length}개</span>
                                )}
                                {file.result.examPoints?.length > 0 && (
                                  <span>시험 포인트 {file.result.examPoints.length}개</span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <Button
                                  size="sm" className="rounded-xl w-full gap-2"
                                  onClick={() => router.push(`/dashboard/quiz?id=${file.supabaseId ?? file.id}`)}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  이해도 퀴즈 풀기 →
                                </Button>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    variant="outline" size="sm" className="rounded-xl gap-1"
                                    onClick={() => router.push(`/dashboard/analysis?id=${file.supabaseId ?? file.id}`)}
                                  >
                                    개념 확인하기
                                  </Button>
                                  <Button
                                    variant="outline" size="sm" className="rounded-xl gap-1"
                                    onClick={() => router.push(`/dashboard/analysis?id=${file.supabaseId ?? file.id}#summary`)}
                                  >
                                    요약 보기
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
