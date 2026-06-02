"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home, Upload, FileText, Network, MessageSquare, GraduationCap,
  Settings, Sparkles, Calendar, StickyNote, LayoutList, BookOpenCheck, X,
  Target, Crown, LogOut, LogIn, Flame, RotateCcw, XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useSidebar } from "./sidebar-context"
import { useAuth } from "./auth-context"
import { getStreak, getStreakEmoji } from "@/lib/streak"
import { FREE_ANALYSIS_LIMIT as FAL, getUsageCount as GUC } from "@/lib/stripe"
import { getDueCards } from "@/lib/spaced-repetition"

const navGroups = [
  {
    label: null,
    items: [
      { name: "홈", href: "/dashboard", icon: Home, exact: true },
    ],
  },
  {
    label: "학습",
    items: [
      { name: "강의", href: "/dashboard/courses", icon: LayoutList },
      { name: "업로드", href: "/dashboard/upload", icon: Upload },
      { name: "퀴즈", href: "/dashboard/quiz", icon: Target },
      { name: "오답노트", href: "/dashboard/wrong-notes", icon: XCircle },
      { name: "학습 노트", href: "/dashboard/notes", icon: StickyNote },
    ],
  },
  {
    label: "분석",
    items: [
      { name: "분석 결과", href: "/dashboard/analysis", icon: FileText },
      { name: "지식 그래프", href: "/dashboard/knowledge", icon: Network },
      { name: "시험 준비", href: "/dashboard/exam", icon: BookOpenCheck },
    ],
  },
  {
    label: "도구",
    items: [
      { name: "플래너", href: "/dashboard/planner", icon: GraduationCap },
      { name: "일정", href: "/dashboard/calendar", icon: Calendar },
      { name: "AI 채팅", href: "/dashboard/chat", icon: MessageSquare },
    ],
  },
]

const navigation = navGroups.flatMap(g => g.items)

const bottomNav = [
  { name: "요금제", href: "/dashboard/pricing", icon: Crown },
  { name: "설정", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, close } = useSidebar()
  const { user, signInWithGoogle, signOut, isPro } = useAuth()
  const [streak, setStreak] = useState({ current: 0, todayDone: false, lastActivityDate: null as string | null })
  const [usageCount, setUsageCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    try {
      const s = getStreak()
      setStreak({ current: s.current, todayDone: s.todayDone, lastActivityDate: s.lastActivityDate })
    } catch {}
    try { setUsageCount(GUC()) } catch {}
    try { setDueCount(getDueCards().length) } catch {}
  }, [])

  useEffect(() => { close() }, [pathname])

  const isActive = (item: typeof navigation[0]) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")

  const streakAtRisk = !streak.todayDone && streak.current > 0 && streak.lastActivityDate !== null

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "사용자"
  const avatarLetter = displayName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  const sidebarContent = (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-300",
      "md:translate-x-0",
      open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* 로고 */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-black tracking-tight text-foreground">UniMind</span>
        </Link>
        <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary md:hidden" onClick={close}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 스트릭 바 */}
      {streak.current > 0 && (
        <div className={cn(
          "mx-3 mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
          streakAtRisk
            ? "bg-orange-500/10 border border-orange-500/20"
            : streak.todayDone
            ? "bg-primary/10 border border-primary/20"
            : "bg-secondary/50"
        )}>
          <Flame className={cn(
            "h-4 w-4 flex-shrink-0",
            streakAtRisk ? "text-orange-500" : "text-primary"
          )} />
          <div className="flex-1">
            <span className={cn("font-semibold", streakAtRisk ? "text-orange-500" : "text-primary")}>
              {streak.current}일 연속 {getStreakEmoji(streak.current)}
            </span>
            {streakAtRisk && (
              <span className="block text-orange-500/80">오늘 퀴즈로 스트릭 유지!</span>
            )}
            {streak.todayDone && (
              <span className="block text-primary/70">오늘 완료 ✓</span>
            )}
          </div>
        </div>
      )}

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label ?? "home"}>
            {group.label && (
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive(item)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-[17px] w-[17px] flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.href === "/dashboard" && dueCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                      {dueCount > 9 ? "9+" : dueCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* 사용량 & 업그레이드 */}
        {!isPro && (
          <div className="mt-4 mx-0">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-foreground">이번 달 분석</p>
                <p className="text-xs text-muted-foreground">{usageCount} / {FAL}</p>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usageCount >= FAL ? "bg-destructive" : usageCount >= FAL - 1 ? "bg-orange-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min((usageCount / FAL) * 100, 100)}%` }}
                />
              </div>
              <Link href="/dashboard/pricing">
                <button className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 hover:bg-primary/20 transition-colors">
                  <Crown className="h-3.5 w-3.5" />
                  Pro로 업그레이드
                </button>
              </Link>
            </div>
          </div>
        )}

        {isPro && (
          <div className="mt-4 mx-0">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-primary">Pro 사용 중</p>
                <p className="text-xs text-muted-foreground">무제한 분석 가능</p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 하단 설정 */}
      <div className="flex-shrink-0 border-t border-border px-3 py-3">
        {bottomNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              pathname === item.href
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.name}
          </Link>
        ))}
      </div>

      {/* 유저 프로필 */}
      <div className="flex-shrink-0 border-t border-border p-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full flex-shrink-0" />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-sm font-bold">{avatarLetter}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                {isPro && <Crown className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
              </div>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center gap-3 rounded-xl bg-secondary/50 p-3 hover:bg-secondary transition-colors"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary border border-border">
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Google로 로그인</p>
              <p className="text-xs text-muted-foreground">데이터를 클라우드에 저장</p>
            </div>
          </button>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={close} />
      )}
      {sidebarContent}
    </>
  )
}
