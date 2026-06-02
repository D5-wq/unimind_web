import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 입력 중이면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // g + u → 업로드
      // g + h → 홈
      // g + q → 퀴즈
      // g + a → 분석

      if (e.key === "u" && !e.metaKey && !e.ctrlKey) router.push("/dashboard/upload")
      if (e.key === "h" && !e.metaKey && !e.ctrlKey) router.push("/dashboard")
      if (e.key === "q" && !e.metaKey && !e.ctrlKey) router.push("/dashboard/quiz")
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [router])
}
