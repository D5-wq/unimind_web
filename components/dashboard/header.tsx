"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSidebar } from "./sidebar-context"
import { Bell, Search, Calendar as CalendarIcon, FileText, CheckCircle2, Trash2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  subtitle?: string
}

interface Notification {
  id: string
  analysisId: string
  title: string
  oneLiner: string
  timestamp: number
  read: boolean
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return "방금 전"
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter()
  const { toggle } = useSidebar()
  const [searchQuery, setSearchQuery] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem("notifications")
        if (saved) setNotifications(JSON.parse(saved))
      } catch {}
    }
    load()
    // 다른 탭/페이지에서 알림 추가되면 반영
    window.addEventListener("storage", load)
    return () => window.removeEventListener("storage", load)
  }, [])

  // 팝오버 열릴 때도 최신 알림 로드
  useEffect(() => {
    if (notifOpen) {
      try {
        const saved = localStorage.getItem("notifications")
        if (saved) setNotifications(JSON.parse(saved))
      } catch {}
    }
  }, [notifOpen])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotificationClick = (notif: Notification) => {
    const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n)
    setNotifications(updated)
    localStorage.setItem("notifications", JSON.stringify(updated))
    setNotifOpen(false)
    router.push(`/dashboard/analysis?id=${notif.analysisId}`)
  }

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    localStorage.setItem("notifications", JSON.stringify(updated))
  }

  const clearAll = () => {
    setNotifications([])
    localStorage.removeItem("notifications")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 md:px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={toggle}>
          <Menu className="h-5 w-5 text-muted-foreground" />
        </Button>
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="hidden sm:block text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* 검색 */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력하세요..."
            className="w-64 rounded-xl border-border bg-secondary/50 pl-9 focus:bg-card"
          />
        </div>

        {/* 캘린더 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            {date && (
              <div className="border-t p-3 text-center text-xs text-muted-foreground">
                선택된 날짜: {format(date, "yyyy-MM-dd")}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* 알림 */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">알림</h4>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {unreadCount}개 읽지 않음
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    모두 읽음
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">아직 알림이 없어요</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">강의를 업로드하면 분석 완료 알림이 표시됩니다</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                        !notif.read && "bg-primary/[0.03]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                          notif.read ? "bg-secondary" : "bg-primary/10"
                        )}>
                          {notif.read
                            ? <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            : <FileText className="h-4 w-4 text-primary" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={cn(
                              "truncate text-xs font-medium",
                              notif.read ? "text-muted-foreground" : "text-foreground"
                            )}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                            {notif.oneLiner}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground/60">
                            분석 완료 · {timeAgo(notif.timestamp)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
