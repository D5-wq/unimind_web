"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CalEvent {
  id: string
  date: string // "YYYY-MM-DD"
  title: string
  type: "exam" | "task" | "note"
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"]

const TYPE_STYLE: Record<CalEvent["type"], string> = {
  exam: "bg-destructive/80 text-white",
  task: "bg-primary/80 text-white",
  note: "bg-accent/80 text-white",
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newType, setNewType] = useState<CalEvent["type"]>("task")

  useEffect(() => {
    // 시험 일정 → CalEvent로 변환
    const examEvents: CalEvent[] = []
    try {
      const exams = JSON.parse(localStorage.getItem("exams") ?? "[]")
      for (const e of exams) {
        examEvents.push({ id: `exam-${e.id}`, date: e.date, title: `📝 ${e.subject}`, type: "exam" })
      }
    } catch {}

    // 사용자 추가 이벤트
    let custom: CalEvent[] = []
    try {
      const c = localStorage.getItem("calendar-events")
      if (c) custom = JSON.parse(c)
    } catch {}

    setEvents([...examEvents, ...custom])
  }, [])

  const saveCustom = (list: CalEvent[]) => {
    const custom = list.filter(e => !e.id.startsWith("exam-"))
    localStorage.setItem("calendar-events", JSON.stringify(custom))
  }

  const addEvent = () => {
    if (!newTitle.trim() || !selected) return
    const e: CalEvent = {
      id: Date.now().toString(),
      date: selected,
      title: newTitle.trim(),
      type: newType,
    }
    const updated = [...events, e]
    setEvents(updated)
    saveCustom(updated)
    setNewTitle("")
    setAdding(false)
  }

  const removeEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id)
    setEvents(updated)
    saveCustom(updated)
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const fmt = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`
  const selectedEvents = selected ? events.filter(e => e.date === selected) : []

  return (
    <div className="flex flex-col">
      <Header title="일정" subtitle="학습 일정을 달력에서 한눈에 확인하세요" />
      <div className="flex flex-1 gap-6 p-6">

        {/* 달력 */}
        <div className="flex-1">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-6">
              {/* 헤더 */}
              <div className="mb-6 flex items-center justify-between">
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={prevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-bold text-foreground">
                  {year}년 {MONTHS[month]}
                </h2>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={nextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* 요일 헤더 */}
              <div className="mb-2 grid grid-cols-7 text-center">
                {WEEKDAYS.map((d, i) => (
                  <div key={d} className={cn("py-2 text-xs font-semibold", i === 0 ? "text-destructive" : i === 6 ? "text-blue-500" : "text-muted-foreground")}>
                    {d}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNum = idx - firstDay + 1
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth
                  const dateStr = isValid ? fmt(dayNum) : ""
                  const dayEvents = isValid ? events.filter(e => e.date === dateStr) : []
                  const isToday = dateStr === todayStr
                  const isSelected = dateStr === selected
                  const isWeekend = idx % 7 === 0 || idx % 7 === 6

                  return (
                    <button
                      key={idx}
                      disabled={!isValid}
                      onClick={() => isValid && setSelected(isSelected ? null : dateStr)}
                      className={cn(
                        "relative flex min-h-[72px] flex-col rounded-xl p-1.5 text-left transition-colors",
                        !isValid && "pointer-events-none opacity-0",
                        isValid && "hover:bg-secondary/50",
                        isSelected && "bg-primary/5 ring-1 ring-primary",
                      )}
                    >
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                        isToday && "bg-primary text-primary-foreground",
                        !isToday && isWeekend && "text-destructive",
                        !isToday && !isWeekend && "text-foreground"
                      )}>
                        {isValid ? dayNum : ""}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map(e => (
                          <div key={e.id} className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium", TYPE_STYLE[e.type])}>
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="px-1 text-[10px] text-muted-foreground">+{dayEvents.length - 2}개</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 사이드 패널 */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {selected ? (
            <>
              <Card className="rounded-2xl border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{selected}</h3>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-lg px-2" onClick={() => setAdding(v => !v)}>
                      <Plus className="h-3.5 w-3.5" />
                      추가
                    </Button>
                  </div>

                  {adding && (
                    <div className="mb-3 space-y-2 rounded-xl bg-secondary/30 p-3">
                      <Input placeholder="일정 내용" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addEvent()} className="h-8 text-sm" />
                      <div className="flex gap-1.5">
                        {(["task", "exam", "note"] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setNewType(t)}
                            className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", newType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}
                          >
                            {t === "task" ? "할 일" : t === "exam" ? "시험" : "노트"}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 flex-1 rounded-lg text-xs" onClick={addEvent}>추가</Button>
                        <Button size="sm" variant="ghost" className="h-7 flex-1 rounded-lg text-xs" onClick={() => setAdding(false)}>취소</Button>
                      </div>
                    </div>
                  )}

                  {selectedEvents.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">이 날 일정이 없어요</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEvents.map(e => (
                        <div key={e.id} className="group flex items-center gap-2 rounded-xl bg-secondary/30 p-2.5">
                          <div className={cn("h-2 w-2 flex-shrink-0 rounded-full", e.type === "exam" ? "bg-destructive" : e.type === "task" ? "bg-primary" : "bg-accent")} />
                          <span className="flex-1 text-sm text-foreground">{e.title}</span>
                          {!e.id.startsWith("exam-") && (
                            <button
                              onClick={() => removeEvent(e.id)}
                              className="hidden h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:flex"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">날짜를 클릭하면<br />일정을 확인하고 추가할 수 있어요</p>
              </CardContent>
            </Card>
          )}

          {/* 이번 달 일정 요약 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">이번 달 일정</h3>
              {events.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length === 0 ? (
                <p className="text-xs text-muted-foreground">등록된 일정이 없어요</p>
              ) : (
                <div className="space-y-2">
                  {events
                    .filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`))
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 5)
                    .map(e => (
                      <div key={e.id} className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 flex-shrink-0 rounded-full", e.type === "exam" ? "bg-destructive" : e.type === "task" ? "bg-primary" : "bg-accent")} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-foreground">{e.title}</p>
                          <p className="text-[10px] text-muted-foreground">{e.date.slice(5)}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
