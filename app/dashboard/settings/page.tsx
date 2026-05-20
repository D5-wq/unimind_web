"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { User, Trash2, Key, Palette, Bell, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const [name, setName] = useState("")
  const [major, setMajor] = useState("")
  const [saved, setSaved] = useState(false)
  const [analysisCount, setAnalysisCount] = useState(0)

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("user-profile") ?? "{}")
      setName(profile.name ?? "")
      setMajor(profile.major ?? "")
    } catch {}
    setAnalysisCount(Object.keys(localStorage).filter(k => k.startsWith("analysis-")).length)
  }, [])

  const saveProfile = () => {
    localStorage.setItem("user-profile", JSON.stringify({ name, major }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const clearAllData = () => {
    if (!confirm("저장된 모든 분석 데이터, 채팅 기록, 시험 일정이 삭제됩니다. 계속할까요?")) return
    const keysToRemove = Object.keys(localStorage).filter(k =>
      k.startsWith("analysis-") ||
      k.startsWith("meta-") ||
      k.startsWith("checklist-") ||
      k.startsWith("timer-") ||
      k === "chat-messages" ||
      k === "exams"
    )
    keysToRemove.forEach(k => localStorage.removeItem(k))
    alert("데이터가 초기화됐어요.")
  }

  return (
    <div className="flex flex-col">
      <Header title="설정" subtitle="앱 환경을 설정하세요" />

      <div className="flex-1 space-y-6 p-6 max-w-2xl">

        {/* 프로필 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-primary" />
              프로필
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={e => setName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="major">학과</Label>
              <Input
                id="major"
                placeholder="학과를 입력하세요 (예: 컴퓨터공학과)"
                value={major}
                onChange={e => setMajor(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button className="rounded-xl" onClick={saveProfile}>
              {saved ? "저장됐어요!" : "저장하기"}
            </Button>
          </CardContent>
        </Card>

        {/* AI 모델 안내 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-5 w-5 text-primary" />
              AI 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
              <div>
                <p className="text-sm font-medium">현재 모델</p>
                <p className="text-xs text-muted-foreground">gpt-4o-mini</p>
              </div>
              <span className="rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600">사용 중</span>
            </div>
            <p className="text-xs text-muted-foreground">
              모델 변경은 <code className="rounded bg-secondary px-1 py-0.5">.env.local</code> 파일의 설정을 수정하세요.
            </p>
          </CardContent>
        </Card>

        {/* 데이터 관리 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-5 w-5 text-primary" />
              데이터 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
              <div>
                <p className="text-sm font-medium">저장된 강의 수</p>
                <p className="text-xs text-muted-foreground">{analysisCount}개</p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full rounded-xl"
              onClick={clearAllData}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              모든 데이터 초기화
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
