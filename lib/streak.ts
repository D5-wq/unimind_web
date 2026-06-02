export interface StreakData {
  current: number        // 현재 연속 일수
  longest: number        // 최장 기록
  lastActivityDate: string | null  // "YYYY-MM-DD"
  totalQuizzes: number   // 총 퀴즈 완료 수
  todayDone: boolean     // 오늘 퀴즈 완료 여부
}

import { STORAGE_KEYS, storageGet, storageSet } from "./storage"
const KEY = STORAGE_KEYS.streak

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function getStreak(): StreakData {
  return storageGet<StreakData>(KEY, { current: 0, longest: 0, lastActivityDate: null, totalQuizzes: 0, todayDone: false })
}

export function recordQuizComplete(): StreakData {
  const streak = getStreak()
  const todayStr = today()

  if (streak.lastActivityDate === todayStr) {
    // 오늘 이미 기록됨 — 퀴즈 수만 증가
    streak.totalQuizzes += 1
    storageSet(KEY, streak)
    return streak
  }

  // 스트릭 계산
  if (streak.lastActivityDate === yesterday()) {
    streak.current += 1
  } else {
    streak.current = 1 // 리셋
  }

  streak.longest = Math.max(streak.longest, streak.current)
  streak.lastActivityDate = todayStr
  streak.totalQuizzes += 1
  streak.todayDone = true

  storageSet(KEY, streak)
  return streak
}

export function getStreakEmoji(current: number): string {
  if (current >= 30) return "🔥🔥🔥"
  if (current >= 14) return "🔥🔥"
  if (current >= 7)  return "🔥"
  if (current >= 3)  return "⚡"
  if (current >= 1)  return "✨"
  return "💤"
}

// 오늘 활동 여부 (대시보드에서 스트릭 위험 경고용)
export function isStreakAtRisk(streak: StreakData): boolean {
  if (!streak.lastActivityDate || streak.current === 0) return false
  return streak.lastActivityDate === yesterday() && !streak.todayDone
}
