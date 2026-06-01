/**
 * 클라이언트 이벤트 로거
 * fire-and-forget — 실패해도 앱 동작에 영향 없음
 */
export function logEvent(
  eventName: string,
  metadata?: Record<string, unknown>,
  userId?: string | null
) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName, metadata: metadata ?? null, userId: userId ?? null }),
  }).catch(() => {}) // 실패 무시
}

// 이벤트 이름 상수 — 오타 방지
export const EVENTS = {
  PDF_UPLOADED:       "pdf_uploaded",
  ANALYSIS_COMPLETE:  "analysis_complete",
  QUIZ_STARTED:       "quiz_started",
  QUIZ_COMPLETE:      "quiz_complete",
  SHARE_LINK_COPIED:  "share_link_copied",
  GOOGLE_LOGIN:       "google_login",
} as const
