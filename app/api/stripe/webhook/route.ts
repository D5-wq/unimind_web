import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature") ?? ""

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret 미설정" }, { status: 500 })
  }

  let event: any
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error("[Stripe Webhook] 서명 검증 실패:", err?.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const session = event.data.object as any

  if (event.type === "checkout.session.completed") {
    const userId = session.metadata?.userId
    if (userId) {
      // Supabase에 Pro 상태 업데이트
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { is_pro: true, stripe_customer_id: session.customer },
      }).catch(err => console.error("[Supabase] Pro 업데이트 실패:", err))
    }
  }

  if (event.type === "customer.subscription.deleted") {
    // 구독 취소 → Pro 해제
    const customerId = session.customer
    // customer → userId 매핑이 필요 (여기서는 생략, 실제 구현 시 DB 조회 필요)
    console.log("[Stripe] 구독 취소:", customerId)
  }

  return NextResponse.json({ received: true })
}
