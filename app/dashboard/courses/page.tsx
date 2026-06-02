"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { BookOpen, Plus, X, FileText, ChevronRight, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { STORAGE_KEYS, storageGet } from "@/lib/storage"
import Link from "next/link"

interface Course {
  id: string
  name: string
  professor: string
  colorIndex: number
}

const COLORS = [
  { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20" },
  { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
  { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/20" },
]

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newProf, setNewProf] = useState("")

  useEffect(() => {
    setCourses(storageGet<Course[]>(STORAGE_KEYS.courses, []))
  }, [])

  const save = (list: Course[]) => {
    setCourses(list)
    localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(list))
  }

  const addCourse = () => {
    if (!newName.trim()) return
    save([...courses, {
      id: Date.now().toString(),
      name: newName.trim(),
      professor: newProf.trim() || "교수명 미입력",
      colorIndex: courses.length % COLORS.length,
    }])
    setNewName(""); setNewProf(""); setAdding(false)
  }

  return (
    <div className="flex flex-col">
      <Header title="강의 목록" subtitle="수강 중인 강의와 분석 자료를 관리하세요" />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">총 {courses.length}개 강의</p>
          <Button className="rounded-xl gap-2" onClick={() => setAdding(v => !v)}>
            <Plus className="h-4 w-4" />강의 추가
          </Button>
        </div>

        {adding && (
          <Card className="mb-5 rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">새 강의 추가</p>
              <Input placeholder="강의명 (예: 데이터베이스)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCourse()} className="h-9 text-sm" autoFocus />
              <Input placeholder="담당 교수 (선택)" value={newProf} onChange={e => setNewProf(e.target.value)} onKeyDown={e => e.key === "Enter" && addCourse()} className="h-9 text-sm" />
              <div className="flex gap-2">
                <Button size="sm" className="rounded-lg" onClick={addCourse}>추가</Button>
                <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { setAdding(false); setNewName(""); setNewProf("") }}>취소</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">강의를 추가해보세요</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">강의를 등록하면 PDF 업로드 시 연결해서<br />과목별 학습 현황을 한눈에 볼 수 있어요</p>
            <Button className="mt-6 rounded-xl gap-2" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />첫 강의 추가하기
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map(course => {
              const color = COLORS[course.colorIndex % COLORS.length]
              const linkedIds = storageGet<string[]>(STORAGE_KEYS.courseAnalyses(course.id), [])

              // 연결된 분석들의 이해도 계산
              let totalUnderstood = 0, totalConfused = 0, totalConcepts = 0
              linkedIds.forEach(aId => {
                const analysis = storageGet<{ concepts?: any[] }>(STORAGE_KEYS.analysis(aId), {})
                const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(aId), {})
                totalConcepts += analysis.concepts?.length ?? 0
                Object.values(understanding).forEach(v => {
                  if (v === "understood") totalUnderstood++
                  if (v === "confused") totalConfused++
                })
              })
              const checked = totalUnderstood + totalConfused
              const healthScore = checked === 0 ? null : Math.round((totalUnderstood / checked) * 85 + 10)

              return (
                <Card key={course.id} className={cn("group rounded-2xl border transition-all hover:border-primary/30", color.border)}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl", color.bg)}>
                        <BookOpen className={cn("h-6 w-6", color.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-foreground">{course.name}</h3>
                            <p className="text-xs text-muted-foreground">{course.professor}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {healthScore !== null && (
                              <span className={cn("text-sm font-black px-2 py-0.5 rounded-lg",
                                healthScore >= 80 ? "bg-green-500/10 text-green-600" :
                                healthScore >= 65 ? "bg-primary/10 text-primary" :
                                "bg-destructive/10 text-destructive"
                              )}>
                                {healthScore}점
                              </span>
                            )}
                            <button onClick={() => save(courses.filter(c => c.id !== course.id))} className="hidden h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive group-hover:flex">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {linkedIds.length === 0 ? (
                          <Link href="/dashboard/upload">
                            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors cursor-pointer">
                              <Plus className="h-4 w-4" />
                              PDF 자료 연결하기
                            </div>
                          </Link>
                        ) : (
                          <div className="space-y-1.5">
                            {linkedIds.slice(0, 3).map(aId => {
                              const meta = storageGet<{ fileName?: string; name?: string }>(STORAGE_KEYS.analysisMeta(aId), {})
                              const fname = (meta.fileName ?? meta.name ?? aId).replace(/\.[^.]+$/, "")
                              return (
                                <Link key={aId} href={`/dashboard/analysis?id=${aId}`}>
                                  <div className="flex items-center gap-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 px-3 py-2 transition-colors">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-xs text-foreground truncate flex-1">{fname}</span>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  </div>
                                </Link>
                              )
                            })}
                            {linkedIds.length > 3 && (
                              <p className="text-xs text-muted-foreground pl-3">+{linkedIds.length - 3}개 더</p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Link href="/dashboard/upload" className="flex-1">
                                <button className="w-full flex items-center justify-center gap-1 rounded-xl border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
                                  <Plus className="h-3 w-3" /> 자료 추가
                                </button>
                              </Link>
                              <Link href={`/dashboard/quiz?id=${linkedIds[0]}`} className="flex-1">
                                <button className={cn("w-full flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-medium transition-colors", color.bg, color.text)}>
                                  <Target className="h-3 w-3" /> 퀴즈 풀기
                                </button>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
