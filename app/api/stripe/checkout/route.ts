import { NextRequest, NextResponse } from "next/server"
import { getStripe, STRIPE_PLANS } from "@/lib/stripe"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const { userId, email } = await req.json()

  if (!userId || !email) {
    return NextResponse.json({ error: "사용자 정보가 필요합니다." }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({ error: "결제 서비스가 아직 준비 중입니다." }, { status: 503 })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: STRIPE_PLANS.pro_monthly.priceId,
          quantity: 1,
        },
      ],
      metadata: { userId },
      success_url: `${req.nextUrl.origin}/dashboard?upgraded=1`,
      cancel_url: `${req.nextUrl.origin}/dashboard/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("[Stripe] 체크아웃 생성 실패:", err?.message)
    return NextResponse.json({ error: "결제 페이지 생성 중 오류가 발생했어요." }, { status: 502 })
  }
}
