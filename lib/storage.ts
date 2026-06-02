/**
 * localStorage 키 중앙 관리
 * 모든 localStorage 접근은 이 파일을 통해서
 */

export const STORAGE_KEYS = {
  // 분석 결과
  analysis: (id: string) => `analysis-${id}`,
  analysisMeta: (id: string) => `meta-${id}`,

  // 개념 이해도
  conceptUnderstanding: (id: string) => `concept-understanding-${id}`,

  // 퀴즈
  quizHistory: "quiz-history",

  // 학습 시스템
  streak: "unimind-streak",
  spacedRep: "unimind-spaced-rep",
  usage: "unimind-usage",

  // 사용자 설정
  userProfile: "user-profile",
  courses: "courses",
  exams: "exams",
  notifications: "notifications",
} as const

function isClient() {
  return typeof window !== "undefined"
}

export function storageGet<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function storageSet(key: string, value: unknown): void {
  if (!isClient()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function storageRemove(key: string): void {
  if (!isClient()) return
  localStorage.removeItem(key)
}
