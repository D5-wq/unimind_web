import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/events
 * 사용자 행동 이벤트 로그
 *
 * Body: { eventName, metadata?, userId? }
 *
 * 이벤트 목록:
 * - pdf_uploaded       파일 선택 시
 * - analysis_complete  분석 완료 시
 * - quiz_started       퀴즈 생성 시작 시
 * - quiz_complete      퀴즈 완료 시 (metadata: { score, total })
 * - share_link_copied  공유 버튼 클릭 시
 * - google_login       Google 로그인 완료 시
 *
 * 퍼널 분석:
 * pdf_uploaded → analysis_complete → quiz_started → quiz_complete
 * → 어느 단계에서 이탈하는지 파악
 */
export async function POST(req: NextRequest) {
  const { eventName, metadata, userId } = await req.json()

  if (!eventName) {
    return NextResponse.json({ error: "eventName 필수" }, { status: 400 })
  }

  const { error } = await supabase.from("events").insert({
    event_name: eventName,
    metadata: metadata ?? null,
    user_id: userId ?? null,
  })

  if (error) {
    // 테이블 미생성 시 조용히 실패 (앱 동작에 영향 없음)
    console.error("[events] insert 실패:", error.message)
    return NextResponse.json({ ok: false })
  }

  return NextResponse.json({ ok: true })
}
