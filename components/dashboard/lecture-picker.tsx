"use client"

import { useAnalysis } from "./analysis-context"
import { ChevronDown, FileText, Check, Loader2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

function timeLabel(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return "방금"
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export function LecturePicker() {
  const { allAnalyses, selectedId, selectedAnalysis, loading, select } = useAnalysis()
  const [open, setOpen] = useState(false)

  if (allAnalyses.length === 0) return null

  const current = allAnalyses.find(a => a.id === selectedId)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-sm transition-colors hover:bg-secondary",
          open && "border-primary/50 bg-secondary"
        )}
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          : <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
        <span className="max-w-[140px] truncate font-medium text-foreground">
          {current?.fileName ?? "강의 선택"}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-border bg-card shadow-xl">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">강의 선택</p>
              <p className="text-xs text-muted-foreground mt-0.5">총 {allAnalyses.length}개 분석됨</p>
            </div>
            <div className="max-h-72 overflow-y-auto py-1.5">
              {allAnalyses.map(a => (
                <button
                  key={a.id}
                  onClick={() => { select(a.id); setOpen(false) }}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/60",
                    a.id === selectedId && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
                    a.id === selectedId ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    {a.id === selectedId
                      ? <Check className="h-3.5 w-3.5" />
                      : <FileText className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "truncate text-sm font-medium",
                      a.id === selectedId ? "text-primary" : "text-foreground"
                    )}>
                      {a.fileName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.oneLiner || "—"}</p>
                    {a.createdAt > 0 && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground/60">{timeLabel(a.createdAt)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
