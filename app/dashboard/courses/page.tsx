"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { BookOpen, Plus, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Course {
  id: string
  name: string
  professor: string
  colorIndex: number
  progress: number
  lastUploadDate?: string
}

const COLORS = [
  { bg: "bg-primary/10", text: "text-primary", bar: "text-primary" },
  { bg: "bg-blue-500/10", text: "text-blue-500", bar: "text-blue-500" },
  { bg: "bg-green-500/10", text: "text-green-500", bar: "text-green-500" },
  { bg: "bg-orange-500/10", text: "text-orange-500", bar: "text-orange-500" },
  { bg: "bg-pink-500/10", text: "text-pink-500", bar: "text-pink-500" },
]

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newProf, setNewProf] = useState("")

  useEffect(() => {
    try {
      const saved = localStorage.getItem("courses")
      if (saved) setCourses(JSON.parse(saved))
    } catch {}
  }, [])

  const save = (list: Course[]) => {
    setCourses(list)
    localStorage.setItem("courses", JSON.stringify(list))
  }

  const addCourse = () => {
    if (!newName.trim()) return
    save([...courses, {
      id: Date.now().toString(),
      name: newName.trim(),
      professor: newProf.trim() || "교수명 미입력",
      colorIndex: courses.length % COLORS.length,
      progress: 0,
    }])
    setNewName("")
    setNewProf("")
    setAdding(false)
  }

  return (
    <div className="flex flex-col">
      <Header title="강의 목록" subtitle="수강 중인 강의를 관리하세요" />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">총 {courses.length}개 강의</p>
          <Button className="rounded-xl gap-2" onClick={() => setAdding(v => !v)}>
            <Plus className="h-4 w-4" />
            강의 추가
          </Button>
        </div>

        {adding && (
          <Card className="mb-5 rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">새 강의 추가</p>
              <Input
                placeholder="강의명 (예: 데이터베이스)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCourse()}
                className="h-9 text-sm"
              />
              <Input
                placeholder="담당 교수 (예: 이수현 교수)"
                value={newProf}
                onChange={e => setNewProf(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCourse()}
                className="h-9 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" className="rounded-lg" onClick={addCourse}>추가</Button>
                <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { setAdding(false); setNewName(""); setNewProf("") }}>취소</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">강의를 추가해보세요</h3>
            <p className="mt-2 text-sm text-muted-foreground">수강 중인 강의를 등록하고 학습 현황을 관리하세요</p>
            <Button className="mt-6 rounded-xl" onClick={() => setAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              첫 강의 추가하기
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {courses.map((course) => {
              const color = COLORS[course.colorIndex % COLORS.length]
              return (
                <Card key={course.id} className="group rounded-2xl border-border shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl", color.bg)}>
                        <BookOpen className={cn("h-6 w-6", color.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-foreground">{course.name}</h3>
                            <p className="text-xs text-muted-foreground">{course.professor}</p>
                          </div>
                          <button
                            onClick={() => save(courses.filter(c => c.id !== course.id))}
                            className="hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive group-hover:flex"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">학습 진행도</span>
                            <span className={cn("font-semibold", color.text)}>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-1.5" />
                        </div>
                        {course.lastUploadDate && (
                          <p className="mt-2 text-xs text-muted-foreground">최근 업로드: {course.lastUploadDate}</p>
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
