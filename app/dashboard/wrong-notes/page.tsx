"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { XCircle, BookOpen, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWrongNotesStore } from "@/lib/store"

interface WrongNote {
  id: string
  analysisId: string
  fileName: string
  question: string
  answer: string
  explanation: string
  type: "ox" | "multiple"
  conceptName?: string
  timestamp: number
}

export default function WrongNotesPage() {
  const { notes, remove, clear: clearAll } = useWrongNotesStore()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const byFile = notes.reduce<Record<string, WrongNote[]>>((acc, n) => {
    const key = n.fileName
    acc[key] = [...(acc[key] ?? []), n]
    return acc
  }, {})

  if (notes.length === 0) {
    return (
      <div className="flex flex-col">
        <Header title="오답노트" subtitle="퀴즈에서 틀린 문제가 자동으로 저장돼요" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-primary/30" />
            <p className="font-medium text-foreground">오답이 없어요!</p>
            <p className="mt-2 text-sm">퀴즈를 풀면 틀린 문제가 여기 쌓여요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="오답노트" subtitle={`틀린 문제 ${notes.length}개`} />
      <div className="flex-1 space-y-6 p-6">

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">퀴즈에서 틀린 문제가 자동 저장돼요. 다시 풀어보세요.</p>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1 rounded-xl" onClick={clearAll}>
            <Trash2 className="h-3.5 w-3.5" /> 전체 삭제
          </Button>
        </div>

        {Object.entries(byFile).map(([fileName, items]) => (
          <Card key={fileName} className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                {fileName.replace(/\.[^.]+$/, "")}
                <span className="text-xs font-normal text-muted-foreground">{items.length}개</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map(note => (
                <div key={note.id} className="overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5">
                  <button
                    onClick={() => toggle(note.id)}
                    className="flex w-full items-start gap-3 p-3.5 text-left hover:bg-destructive/10 transition-colors"
                  >
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-relaxed">{note.question}</p>
                      {note.conceptName && (
                        <span className="text-xs text-muted-foreground">관련 개념: {note.conceptName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); remove(note.id) }} className="rounded-lg p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {expanded.has(note.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {expanded.has(note.id) && (
                    <div className="border-t border-destructive/20 bg-card px-5 py-4 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-destructive mb-1">정답</p>
                        <p className="text-sm font-bold text-foreground">{note.answer}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">해설</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{note.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
