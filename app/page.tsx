"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const COPY = {
  ko: {
    nav: { browse: "둘러보기", login: "시작하기" },
    hero: {
      badge: "대학생이 직접 만든 AI 학습 도구",
      h1: ["시험 전날", "밤새는 거", "그만해도 돼"],
      sub: "강의 PDF 올리면 AI가 핵심 개념 정리하고, 퀴즈 만들어주고, 지금 상태면 시험 몇 점 나올지도 알려줘.",
      cta: "Google로 무료 시작",
      sub2: "신용카드 없어도 돼 · 월 5회 무료",
    },
    story: {
      title: "이게 왜 만들어졌냐면",
      body: "저도 매번 시험 전날 슬라이드 80장 다시 읽다가 지쳐서 만들었어요. AI가 알아서 뽑아주면 되잖아요.",
      name: "— 홍대 컴공 3학년 개발자",
    },
    how: {
      title: "이렇게 씁니다",
      steps: [
        { num: "01", title: "PDF 올리기", desc: "강의 자료 파일 하나 드래그하면 끝" },
        { num: "02", title: "AI가 정리", desc: "핵심 개념이랑 흐름 자동으로 추출" },
        { num: "03", title: "퀴즈로 테스트", desc: "AI가 만든 OX, 4지선다로 실력 확인" },
        { num: "04", title: "시험 점수 예측", desc: "지금 이해도면 몇 점 나오는지 계산" },
      ],
    },
    proof: {
      title: "실제로 이런 거 됩니다",
      items: [
        { emoji: "📚", text: "TCP Handshake 개념 헷갈리면 AI한테 바로 물어볼 수 있어요" },
        { emoji: "🎯", text: "퀴즈 틀린 문제는 오답노트에 자동으로 저장돼요" },
        { emoji: "📊", text: "시험 D-7이면 오늘 뭐 공부해야 하는지 알려줘요" },
        { emoji: "🔥", text: "매일 퀴즈 풀면 스트릭 쌓여요. 게임처럼" },
      ],
    },
    cta2: {
      title: "기말 전에 한 번만 써봐요",
      sub: "어차피 공부해야 하는데, 더 빠르게 하면 되잖아요.",
      btn: "무료로 시작하기",
    },
    footer: "홍대 3학년이 만든 AI 학습 도구",
    loading: "잠깐만요...",
  },
  en: {
    nav: { browse: "Browse", login: "Get started" },
    hero: {
      badge: "Built by a college student, for college students",
      h1: ["Stop pulling", "all-nighters", "before exams"],
      sub: "Upload your lecture PDF → AI extracts key concepts → generates quizzes → predicts your exam score.",
      cta: "Start free with Google",
      sub2: "No credit card needed · 5 free analyses/month",
    },
    story: {
      title: "Why I built this",
      body: "I was tired of re-reading 80 slides the night before every exam. So I built something that does the boring part for me.",
      name: "— CS junior, Hongik University",
    },
    how: {
      title: "How it works",
      steps: [
        { num: "01", title: "Upload PDF", desc: "Drag and drop your lecture file" },
        { num: "02", title: "AI analyzes", desc: "Key concepts and flow extracted automatically" },
        { num: "03", title: "Take a quiz", desc: "OX and multiple choice questions, auto-generated" },
        { num: "04", title: "Score prediction", desc: "See what score you'd likely get right now" },
      ],
    },
    proof: {
      title: "Here's what it actually does",
      items: [
        { emoji: "📚", text: "Confused about TCP Handshake? Ask the AI inline, instantly" },
        { emoji: "🎯", text: "Wrong quiz answers are saved automatically to your mistake log" },
        { emoji: "📊", text: "7 days before exam? It tells you exactly what to study today" },
        { emoji: "🔥", text: "Daily quiz streaks. Feels like a game, works like studying" },
      ],
    },
    cta2: {
      title: "Try it before finals",
      sub: "You're going to study anyway. Might as well be faster about it.",
      btn: "Get started free",
    },
    footer: "Built by a college junior at Hongik University",
    loading: "Loading...",
  },
}

const GoogleIcon = () => (
  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<"ko" | "en">("ko")
  const t = COPY[lang]

  const handleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* 네비 */}
      <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100 bg-white/90 px-6 md:px-10 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl">🧠</span>
          <span className="text-lg font-black tracking-tight text-gray-900">UniMind</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(l => l === "ko" ? "en" : "ko")}
            className="rounded-lg px-2.5 py-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {lang === "ko" ? "EN" : "KR"}
          </button>
          <Link href="/dashboard">
            <button className="rounded-xl px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {t.nav.browse}
            </button>
          </Link>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="rounded-xl bg-gray-900 px-4 py-1.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? t.loading : t.nav.login}
          </button>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 md:pt-28">
        <div className="mb-6 inline-block rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
          {t.hero.badge}
        </div>

        <h1 className="mb-6 text-5xl md:text-7xl font-black leading-[1.05] tracking-tighter text-gray-900">
          {t.hero.h1.map((line, i) => (
            <span key={i} className={`block ${i === 1 ? "text-purple-600" : ""}`}>{line}</span>
          ))}
        </h1>

        <p className="mb-10 max-w-xl text-lg text-gray-500 leading-relaxed">
          {t.hero.sub}
        </p>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center gap-3 rounded-2xl bg-gray-900 px-7 py-4 text-base font-bold text-white shadow-lg hover:bg-gray-700 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            <GoogleIcon />
            {loading ? t.loading : t.hero.cta}
          </button>
          <Link href="/dashboard">
            <button className="rounded-2xl border-2 border-gray-200 px-7 py-4 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
              {t.nav.browse} →
            </button>
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">{t.hero.sub2}</p>

        {/* PH 배지 */}
        <a href="https://www.producthunt.com/posts/unimind-2" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block">
          <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=unimind-2&theme=light" alt="UniMind on Product Hunt" style={{ width: 200, height: 43 }} />
        </a>
      </section>

      {/* 만든 이유 — 인간적인 섹션 */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-14">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-500">{t.story.title}</p>
          <p className="text-xl text-gray-700 leading-relaxed font-medium">
            "{t.story.body}"
          </p>
          <p className="mt-4 text-sm text-gray-400">{t.story.name}</p>
        </div>
      </section>

      {/* 작동 방식 */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-3xl font-black text-gray-900">{t.how.title}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {t.how.steps.map(({ num, title, desc }) => (
            <div key={num} className="group rounded-2xl border-2 border-gray-100 p-6 hover:border-purple-200 hover:bg-purple-50/50 transition-all">
              <p className="mb-4 text-4xl font-black text-purple-200 group-hover:text-purple-300 transition-colors">{num}</p>
              <p className="mb-2 font-bold text-gray-900">{title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 실제 기능들 */}
      <section className="bg-gray-900 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-3xl font-black text-white">{t.proof.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {t.proof.items.map(({ emoji, text }) => (
              <div key={text} className="flex items-start gap-4 rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/8 transition-colors">
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <p className="text-gray-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 스트릭 — 작게 */}
      <section className="border-b border-gray-100 px-6 py-12">
        <div className="mx-auto max-w-md text-center">
          <p className="mb-4 text-sm font-medium text-gray-400">매일 하면 스트릭 쌓여요</p>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5,6,7].map(d => (
              <div key={d} className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${d <= 5 ? "bg-orange-100 text-orange-500" : "bg-gray-100 text-gray-300"}`}>
                {d <= 5 ? "🔥" : d}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 최하단 CTA */}
      <section className="px-6 py-24 text-center">
        <h2 className="mb-4 text-4xl font-black text-gray-900">{t.cta2.title}</h2>
        <p className="mb-10 text-lg text-gray-400">{t.cta2.sub}</p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="inline-flex items-center gap-3 rounded-2xl bg-purple-600 px-10 py-5 text-xl font-black text-white shadow-xl hover:bg-purple-700 transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          <GoogleIcon />
          {loading ? t.loading : t.cta2.btn}
        </button>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">🧠</span>
          <span className="font-black text-gray-900">UniMind</span>
        </div>
        <p className="text-sm text-gray-400">{t.footer}</p>
      </footer>
    </div>
  )
}
