import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
    _stripe = new Stripe(key)
  }
  return _stripe
}

export const STRIPE_PLANS = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    name: "Pro 월간",
    price: 4900,
    interval: "month" as const,
  },
}

export const FREE_ANALYSIS_LIMIT = 5

export function getUsageCount(): number {
  if (typeof window === "undefined") return 0
  try {
    const data = JSON.parse(localStorage.getItem("unimind-usage") ?? "{}")
    const month = new Date().toISOString().slice(0, 7)
    return data[month] ?? 0
  } catch { return 0 }
}

export function incrementUsage(): number {
  if (typeof window === "undefined") return 1
  try {
    const data = JSON.parse(localStorage.getItem("unimind-usage") ?? "{}")
    const month = new Date().toISOString().slice(0, 7)
    data[month] = (data[month] ?? 0) + 1
    localStorage.setItem("unimind-usage", JSON.stringify(data))
    return data[month]
  } catch { return 1 }
}
