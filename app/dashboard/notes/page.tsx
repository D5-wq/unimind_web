"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { Plus, Trash2, Tag, Save, StickyNote, Bold, Italic, Underline, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  updatedAt: number
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return "방금 전"
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [saved, setSaved] = useState(true)
  const [showList, setShowList] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const n = localStorage.getItem("notes")
      if (n) setNotes(JSON.parse(n))
    } catch {}
  }, [])

  const saveNotes = (list: Note[]) => {
    setNotes(list)
    localStorage.setItem("notes", JSON.stringify(list))
  }

  const selectNote = (note: Note) => {
    setSelectedId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setTags(note.tags)
    setSaved(true)
    setShowList(false)
  }

  const createNote = () => {
    const note: Note = {
      id: Date.now().toString(),
      title: "새 노트",
      content: "",
      tags: [],
      updatedAt: Date.now(),
    }
    const updated = [note, ...notes]
    saveNotes(updated)
    selectNote(note)
  }

  const saveNote = () => {
    if (!selectedId) return
    const updated = notes.map(n =>
      n.id === selectedId ? { ...n, title, content, tags, updatedAt: Date.now() } : n
    )
    saveNotes(updated)
    setSaved(true)
  }

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
      setTitle("")
      setContent("")
      setTags([])
      setShowList(true)
    }
  }

  const addTag = () => {
    const t = tagInput.replace(/^#/, "").trim()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      setSaved(false)
    }
    setTagInput("")
  }

  const removeTag = (t: string) => {
    setTags(prev => prev.filter(x => x !== t))
    setSaved(false)
  }

  // Apply markdown-style formatting around selected text
  const applyFormat = (type: "bold" | "italic" | "underline" | "list") => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)

    let before = "", after = ""
    if (type === "bold") { before = "**"; after = "**" }
    else if (type === "italic") { before = "_"; after = "_" }
    else if (type === "underline") { before = "<u>"; after = "</u>" }
    else if (type === "list") {
      // Prefix each selected line with "- "
      const lines = (selected || "새 항목").split("\n").map(l => `- ${l}`)
      const replacement = lines.join("\n")
      const next = content.slice(0, start) + replacement + content.slice(end)
      setContent(next)
      setSaved(false)
      setTimeout(() => {
        ta.focus()
        ta.setSelectionRange(start, start + replacement.length)
      }, 0)
      return
    }

    const replacement = before + (selected || "텍스트") + after
    const next = content.slice(0, start) + replacement + content.slice(end)
    setContent(next)
    setSaved(false)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + (selected || "텍스트").length)
    }, 0)
  }

  return (
    <div className="flex flex-col">
      <Header title="학습 노트" subtitle="강의 내용을 나만의 언어로 정리하세요" />
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

        {/* 노트 목록 — hidden on mobile when editor is open */}
        <div className={cn(
          "flex flex-col border-r border-border bg-card",
          "w-full md:w-72 md:flex-shrink-0",
          !showList && "hidden md:flex"
        )}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">노트 목록 ({notes.length})</h3>
            <Button size="sm" className="h-7 rounded-lg px-2" onClick={createNote}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <StickyNote className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">아직 노트가 없어요</p>
                <p className="mt-1 text-xs text-muted-foreground/60">+ 버튼으로 노트를 만들어보세요</p>
              </div>
            ) : (
              notes.map(note => (
                <button
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={cn(
                    "group w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                    selectedId === note.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", selectedId === note.id ? "text-primary" : "text-foreground")}>
                        {note.title || "제목 없음"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {note.content.replace(/[*_<>]/g, "") || "내용 없음"}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(note.updatedAt)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                      className="hidden h-6 w-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive group-hover:flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {note.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map(t => (
                        <span key={t} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">#{t}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* 에디터 */}
        {selectedId ? (
          <div className={cn("flex flex-1 flex-col", showList && "hidden md:flex")}>
            {/* 툴바 */}
            <div className="flex items-center justify-between border-b border-border bg-card px-5 py-2">
              <div className="flex items-center gap-1">
                {/* Mobile back button */}
                <button
                  className="mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
                  onClick={() => setShowList(true)}
                >
                  ←
                </button>
                <button
                  onClick={() => applyFormat("bold")}
                  title="굵게 (**text**)"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  onClick={() => applyFormat("italic")}
                  title="기울임 (_text_)"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => applyFormat("underline")}
                  title="밑줄 (<u>text</u>)"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Underline className="h-4 w-4" />
                </button>
                <button
                  onClick={() => applyFormat("list")}
                  title="목록 (- item)"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <List className="h-4 w-4" />
                </button>
                <span className="ml-1 text-[10px] text-muted-foreground/50 hidden sm:block">텍스트 선택 후 클릭</span>
              </div>
              <Button
                size="sm"
                className={cn("h-8 rounded-lg gap-1.5", saved ? "opacity-50" : "")}
                onClick={saveNote}
                disabled={saved}
              >
                <Save className="h-3.5 w-3.5" />
                {saved ? "저장됨" : "저장"}
              </Button>
            </div>

            {/* 노트 내용 */}
            <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
              <Input
                value={title}
                onChange={e => { setTitle(e.target.value); setSaved(false) }}
                placeholder="노트 제목"
                className="mb-4 border-0 bg-transparent px-0 text-2xl font-bold text-foreground shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0"
              />
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => { setContent(e.target.value); setSaved(false) }}
                placeholder={`강의 내용을 자유롭게 정리해보세요...

예시:
- 핵심 개념 정리
- 이해가 안 되는 부분
- 교수님 말씀 중 중요한 것

서식 버튼으로 **굵게**, _기울임_, <u>밑줄</u> 적용 가능`}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 font-mono"
              />
            </div>

            {/* 태그 */}
            <div className="border-t border-border bg-card px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    #{t}
                    <button onClick={() => removeTag(t)} className="hover:text-destructive">×</button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addTag() } }}
                  placeholder="#태그 추가"
                  className="bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/40 w-24"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <StickyNote className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">노트를 선택하거나 새로 만들어보세요</p>
            <Button className="mt-4 rounded-xl" onClick={createNote}>
              <Plus className="mr-2 h-4 w-4" />
              새 노트 만들기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
