"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { Send, Sparkles, User, FileText, Copy, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content: "안녕하세요! 강의 자료에 대해 무엇이든 질문하세요.",
  timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
}

const DEFAULT_SUGGESTIONS = [
  "이 내용으로 예상 시험 문제 만들어줘",
  "핵심 개념을 쉽게 설명해줘",
  "강의 흐름을 한 번 더 정리해줘",
  "시험에 자주 나오는 내용이 뭐야?",
]

function buildSuggestions(ctx: any): string[] {
  if (!ctx?.concepts?.length) return DEFAULT_SUGGESTIONS
  const concepts: { name: string }[] = ctx.concepts
  const picks = concepts.slice(0, 2).map(c => `${c.name}을(를) 쉽게 설명해줘`)
  return [
    ...picks,
    "이 내용으로 예상 시험 문제 만들어줘",
    "이 강의에서 가장 중요한 개념이 뭐야?",
  ]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [analysisContext, setAnalysisContext] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 최신 분석 컨텍스트 불러오기
    const keys = Object.keys(localStorage).filter(k => k.startsWith("analysis-"))
    keys.sort((a, b) => {
      const ia = a.replace("analysis-", "")
      const ib = b.replace("analysis-", "")
      try {
        const ma = JSON.parse(localStorage.getItem(`meta-${ia}`) ?? "{}")
        const mb = JSON.parse(localStorage.getItem(`meta-${ib}`) ?? "{}")
        return (mb.uploadedAt ?? 0) - (ma.uploadedAt ?? 0)
      } catch { return 0 }
    })
    if (keys.length > 0) {
      try {
        setAnalysisContext(JSON.parse(localStorage.getItem(keys[0]) ?? ""))
      } catch {}
    }

    // 저장된 채팅 기록 불러오기
    try {
      const saved = localStorage.getItem("chat-messages")
      if (saved) {
        const parsed: Message[] = JSON.parse(saved)
        if (parsed.length > 0) setMessages(parsed)
      }
    } catch {}
  }, [])

  // 새 메시지마다 맨 아래로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // 메시지 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("chat-messages", JSON.stringify(messages))
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          analysisContext,
        }),
      })

      const data = await res.json()

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer ?? "오류가 발생했어요. 다시 시도해주세요.",
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "오류가 발생했어요. 다시 시도해주세요.",
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE])
    localStorage.removeItem("chat-messages")
  }

  return (
    <div className="flex h-screen flex-col">
      <Header title="AI 채팅" subtitle="강의 내용에 대해 질문하세요" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 분석 컨텍스트 바 */}
        {analysisContext && (
          <div className="border-b border-border bg-secondary/30 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">분석된 강의 자료 기반으로 답변합니다</p>
                  <p className="text-xs text-muted-foreground">{analysisContext.oneLiner}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                onClick={clearChat}
                title="대화 초기화"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-4", message.role === "user" ? "flex-row-reverse" : "")}
              >
                <div className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                  message.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                )}>
                  {message.role === "assistant"
                    ? <Sparkles className="h-5 w-5" />
                    : <User className="h-5 w-5" />}
                </div>

                <div className={cn(
                  "max-w-[75%] space-y-2",
                  message.role === "user" ? "items-end" : ""
                )}>
                  <div className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === "assistant"
                      ? "bg-card border border-border"
                      : "bg-primary text-primary-foreground"
                  )}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>

                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                        onClick={() => navigator.clipboard.writeText(message.content)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                      <span className="ml-2 text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                  )}
                  {message.role === "user" && (
                    <span className="block text-right text-xs text-muted-foreground">
                      {message.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div className="rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            )}

            {/* 자동 스크롤 앵커 */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 추천 질문 */}
        <div className="border-t border-border bg-card px-6 py-3">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs text-muted-foreground">추천 질문</p>
            <div className="flex flex-wrap gap-2">
              {buildSuggestions(analysisContext).map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="rounded-xl border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 입력창 */}
        <div className="border-t border-border bg-card px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-2 focus-within:border-primary/50">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="강의 내용에 대해 질문하세요..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl"
                size="icon"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
