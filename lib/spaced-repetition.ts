/**
 * Spaced Repetition System (에빙하우스 망각곡선 기반)
 * 간소화된 SM-2 알고리즘 구현
 *
 * 복습 인터벌: 1일 → 3일 → 7일 → 14일 → 30일
 * "이해했어요" → 다음 단계로 진행
 * "헷갈려요"  → 1일 후 다시 복습 (리셋 X, 인터벌만 단축)
 */

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] // 복습 인터벌 (일)

export interface RepCard {
  conceptName: string
  analysisId: string
  fileName: string          // 어느 강의인지
  nextReview: string        // ISO date "YYYY-MM-DD"
  intervalIndex: number     // 0~4 (REVIEW_INTERVALS 인덱스)
  totalReviews: number
  createdAt: string
}

import { STORAGE_KEYS, storageGet, storageSet } from "./storage"
const KEY = STORAGE_KEYS.spacedRep

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function loadAll(): Record<string, RepCard> {
  return storageGet<Record<string, RepCard>>(KEY, {})
}

function saveAll(data: Record<string, RepCard>) {
  storageSet(KEY, data)
}

function cardKey(analysisId: string, conceptName: string) {
  return `${analysisId}::${conceptName}`
}

/** 개념을 복습 스케줄에 등록 (처음 이해했어요 체크 시 호출) */
export function scheduleReview(analysisId: string, conceptName: string, fileName: string) {
  const all = loadAll()
  const key = cardKey(analysisId, conceptName)
  if (all[key]) return // 이미 등록됨

  all[key] = {
    conceptName,
    analysisId,
    fileName,
    nextReview: addDays(REVIEW_INTERVALS[0]), // 1일 후
    intervalIndex: 0,
    totalReviews: 0,
    createdAt: todayStr(),
  }
  saveAll(all)
}

/** 복습 완료 — "이해했어요": 인터벌 증가 / "헷갈려요": 1일 후 다시 */
export function completeReview(analysisId: string, conceptName: string, understood: boolean) {
  const all = loadAll()
  const key = cardKey(analysisId, conceptName)
  const card = all[key]
  if (!card) return

  card.totalReviews += 1

  if (understood) {
    const nextIdx = Math.min(card.intervalIndex + 1, REVIEW_INTERVALS.length - 1)
    card.intervalIndex = nextIdx
    card.nextReview = addDays(REVIEW_INTERVALS[nextIdx])
  } else {
    // 헷갈려요: 인터벌 줄이기 (최소 0)
    card.intervalIndex = Math.max(card.intervalIndex - 1, 0)
    card.nextReview = addDays(1)
  }

  saveAll(all)
}

/** 오늘 복습해야 할 카드 목록 */
export function getDueCards(): RepCard[] {
  const all = loadAll()
  const today = todayStr()
  return Object.values(all)
    .filter(c => c.nextReview <= today)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
}

/** 전체 카드 수 */
export function getTotalCards(): number {
  return Object.keys(loadAll()).length
}

/** 특정 분석의 카드들 */
export function getCardsForAnalysis(analysisId: string): RepCard[] {
  const all = loadAll()
  return Object.values(all).filter(c => c.analysisId === analysisId)
}

/** 복습 진행도 요약 */
export function getReviewSummary() {
  const all = loadAll()
  const cards = Object.values(all)
  const today = todayStr()
  return {
    total: cards.length,
    dueToday: cards.filter(c => c.nextReview <= today).length,
    mastered: cards.filter(c => c.intervalIndex >= REVIEW_INTERVALS.length - 1).length, // 30일 도달
  }
}

/** 특정 개념의 다음 복습 날짜 */
export function getNextReview(analysisId: string, conceptName: string): string | null {
  const all = loadAll()
  return all[cardKey(analysisId, conceptName)]?.nextReview ?? null
}
