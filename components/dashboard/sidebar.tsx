"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home, Upload, FileText, Network, MessageSquare, GraduationCap,
  Settings, Sparkles, Calendar, StickyNote, LayoutList, BookOpenCheck, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useSidebar } from "./sidebar-context"

const navigation = [
  { name: "홈", href: "/dashboard", icon: Home, exact: true },
  { name: "강의 목록", href: "/dashboard/courses", icon: LayoutList },
  { name: "자료 업로드", href: "/dashboard/upload", icon: Upload },
  { name: "분석 결과", href: "/dashboard/analysis", icon: FileText },
  { name: "학습 플래너", href: "/dashboard/planner", icon: GraduationCap },
  { name: "일정", href: "/dashboard/calendar", icon: Calendar },
  { name: "AI 채팅", href: "/dashboard/chat", icon: MessageSquare },
  { name: "학습 노트", href: "/dashboard/notes", icon: StickyNote },
  { name: "개념 맵", href: "/dashboard/concept-map", icon: Network },
  { name: "시험 준비", href: "/dashboard/exam", icon: BookOpenCheck },
]

const bottomNav = [
  { name: "설정", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState({ name: "사용자", major: "학과 미설정" })
  const { open, close } = useSidebar()

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user-profile")
      if (saved) {
        const p = JSON.parse(saved)
        setProfile({ name: p.name || "사용자", major: p.major || "학과 미설정" })
      }
    } catch {}
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => { close() }, [pathname])

  const isActive = (item: typeof navigation[0]) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")

  const sidebarContent = (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-300",
      // Mobile: slide in/out. Desktop: always visible
      "md:translate-x-0",
      open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">UniMind</h1>
            <p className="text-xs text-muted-foreground">AI 학습 어시스턴트</p>
          </div>
        </Link>
        {/* Close button — mobile only */}
        <button
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary md:hidden"
          onClick={close}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">메뉴</p>
        <div className="space-y-0.5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive(item)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

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

      <div className="flex-shrink-0 border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-sm font-bold">{profile.name.charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.major}</p>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Backdrop — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}
      {sidebarContent}
    </>
  )
}
