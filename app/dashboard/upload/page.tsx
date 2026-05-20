"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import {
  Upload, FileText, Presentation, X, CheckCircle, Loader2, Sparkles, File, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

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
  const router = useRouter()

  const analyzeFile = async (file: File, id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "uploading", progress: 20 } : f))

    try {
      // 브라우저에서 텍스트 추출 (파일 바이너리 전송 없음)
      const text = await extractTextFromFile(file)

      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "analyzing", progress: 60 } : f))

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 8000), fileName: file.name }),
      })

      const result = await res.json()
      const storageId = result.supabaseId ?? id

      // 완료
      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, status: "complete", progress: 100, result, supabaseId: result.supabaseId } : f
      ))

      // 결과를 localStorage에 저장 (supabaseId 키 우선)
      localStorage.setItem(`analysis-${storageId}`, JSON.stringify(result))
      localStorage.setItem(`meta-${storageId}`, JSON.stringify({ name: file.name, uploadedAt: Date.now() }))

      // 알림 추가
      const prevNotifs = JSON.parse(localStorage.getItem("notifications") ?? "[]")
      prevNotifs.unshift({
        id: `notif-${storageId}`,
        analysisId: storageId,
        title: file.name,
        oneLiner: result.oneLiner ?? "",
        timestamp: Date.now(),
        read: false,
      })
      localStorage.setItem("notifications", JSON.stringify(prevNotifs.slice(0, 20)))

    } catch (err) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "error" } : f))
    }
  }

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
    }))

    setFiles(prev => [...newFiles, ...prev])

    // 각 파일 실제 분석 시작
    Array.from(fileList).forEach((file, index) => {
      analyzeFile(file, newFiles[index].id)
    })
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading": return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      case "analyzing": return <Sparkles className="h-5 w-5 animate-pulse text-accent" />
      case "complete": return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error": return <AlertCircle className="h-5 w-5 text-destructive" />
    }
  }

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading": return "업로드 중..."
      case "analyzing": return "AI 분석 중..."
      case "complete": return "분석 완료"
      case "error": return "오류 발생"
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="강의 자료 업로드" subtitle="PDF 또는 PPTX를 업로드하고 AI 분석을 시작하세요" />

      <div className="flex-1 space-y-6 p-6">
        <Card className={cn(
          "rounded-2xl border-2 border-dashed transition-all duration-300",
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
                <Upload className={cn("h-12 w-12 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">강의 자료를 드래그하여 업로드</h3>
              <p className="mb-6 text-sm text-muted-foreground">PDF 또는 PPTX 파일을 선택하세요 (최대 50MB)</p>
              <label>
                <input
                  type="file"
                  accept=".pdf,.pptx"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Button className="rounded-xl px-8" asChild>
                  <span><File className="mr-2 h-4 w-4" />파일 선택</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

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
                      <div className="mt-4 rounded-xl bg-accent/10 p-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 animate-pulse text-accent" />
                          <div>
                            <p className="text-sm font-medium">AI가 강의 내용을 분석하고 있습니다</p>
                            <p className="text-xs text-muted-foreground">핵심 개념 추출, 요약 생성, 시험 예상 문제 분석 중...</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {file.status === "complete" && file.result && (
                      <div className="mt-4 space-y-3">
                        {/* 한 줄 요약 미리보기 */}
                        <div className="rounded-xl bg-primary/5 p-3">
                          <p className="text-sm font-medium text-primary">✨ {file.result.oneLiner}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="rounded-lg"
                            onClick={() => router.push(`/dashboard/analysis?id=${file.supabaseId ?? file.id}`)}
                          >
                            분석 결과 보기
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => router.push(`/dashboard/chat`)}
                          >
                            AI에게 질문하기
                          </Button>
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