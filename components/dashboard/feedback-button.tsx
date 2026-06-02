"use client"

import { useState } from "react"
import { MessageSquarePlus, X, Send, Bug, Lightbulb, ThumbsUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const TYPES = [
  { id: "bug", icon: Bug, label: "버그 제보", color: "text-destructive" },
  { id: "idea", icon: Lightbulb, label: "기능 제안", color: "text-yellow-500" },
  { id: "good", icon: ThumbsUp, label: "좋았던 점", color: "text-green-500" },
] as const

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<typeof TYPES[number]["id"]>("good")
  const [text, setText] = useState("")
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await supabase.from("feedback").insert({
        type,
        message: text.trim(),
        page: window.location.pathname,
        created_at: new Date().toISOString(),
      })
    } catch {}
    setSent(true)
    setSending(false)
    setTimeout(() => { setOpen(false); setSent(false); setText("") }, 1500)
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-lg transition-all",
          open ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground hover:scale-105"
        )}
      >
        {open ? <X className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
        <span className="hidden md:inline">{open ? "닫기" : "피드백"}</span>
      </button>

      {/* 패널 */}
      {open && (
        <div className="fixed bottom-20 left-6 z-50 w-72 rounded-2xl border border-border bg-card shadow-2xl p-4">
          {sent ? (
            <div className="py-6 text-center">
              <p className="text-2xl mb-2">🙏</p>
              <p className="font-bold text-foreground">감사합니다!</p>
              <p className="text-xs text-muted-foreground mt-1">피드백이 전달됐어요</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-foreground mb-3">피드백 보내기</p>
              <div className="flex gap-2 mb-3">
                {TYPES.map(({ id, icon: Icon, label, color }) => (
                  <button
                    key={id}
                    onClick={() => setType(id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-all border-2",
                      type === id ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", type === id ? "text-primary" : color)} />
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="어떤 점이 불편했나요? 뭐가 좋았나요?"
                className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                rows={3}
                autoFocus
              />
              <button
                onClick={send}
                disabled={!text.trim() || sending}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? "전송 중..." : "보내기"}
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
