"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Sparkles } from "lucide-react"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) router.push("/?error=auth")
        else router.push("/dashboard")
      })
    } else {
      // implicit flow — session already set via hash
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) router.push("/dashboard")
        else router.push("/")
      })
    }
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-6">
        <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
      </div>
      <p className="text-lg font-semibold text-foreground">로그인 중...</p>
      <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Sparkles className="h-8 w-8 animate-pulse text-primary" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
