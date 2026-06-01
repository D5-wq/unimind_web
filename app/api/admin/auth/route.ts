import { NextRequest, NextResponse } from "next/server"

// NEXT_PUBLIC_ 아님 — 클라이언트 번들에 노출 안 됨
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "unimind2026"

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
