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
    before_after: {
      title: "이전이랑 이후가 진짜 달라요",
      before: {
        label: "BEFORE",
        items: [
          "교수님 PPT 80장 처음부터 다시 읽기",
          "뭐가 중요한지 모르는 채로 밑줄",
          "시험 전날 밤 12시에 시작",
          "어디서 문제 나올지 감도 없음",
        ],
      },
      after: {
        label: "AFTER",
        items: [
          "PDF 올리면 핵심 개념 7개 자동 추출",
          "AI가 OX, 4지선다 퀴즈 즉시 생성",
          "틀린 문제 오답노트에 자동 저장",
          "시험 예상 점수까지 계산해줌",
        ],
      },
    },
    stats: [
      { value: "8초", label: "평균 분석 시간" },
      { value: "5개+", label: "기능" },
      { value: "무료", label: "기본 플랜" },
      { value: "100%", label: "AI 기반" },
    ],
    how: {
      title: "이렇게 씁니다",
      steps: [
        { num: "01", emoji: "📄", title: "PDF 올리기", desc: "강의 자료 파일 하나 드래그하면 끝. 8초면 분석 완료." },
        { num: "02", emoji: "🧠", title: "AI가 정리", desc: "핵심 개념, 강의 흐름, 시험 포인트 자동으로 뽑아줌." },
        { num: "03", emoji: "🎯", title: "퀴즈로 확인", desc: "AI가 만든 OX, 4지선다 문제로 내 이해도 체크." },
        { num: "04", emoji: "📊", title: "점수 예측", desc: "지금 이해도면 실제 시험에서 몇 점 나올지 계산." },
      ],
    },
    testimonials: {
      title: "실제로 쓴 사람들 얘기",
      items: [
        {
          text: "네트워크 중간고사 전날에 썼는데, 뭘 공부해야 할지 바로 알 수 있었어요. 교수님 슬라이드 70장을 30분 만에 정리한 느낌.",
          name: "이○○",
          info: "컴공 3학년",
          emoji: "💬",
        },
        {
          text: "오답노트 자동으로 쌓이는 게 진짜 좋아요. 퀴즈 틀린 거 나중에 몰아서 다시 볼 수 있으니까.",
          name: "박○○",
          info: "전자공학 2학년",
          emoji: "💬",
        },
        {
          text: "시험 예상 점수 기능이 신기했어요. 처음엔 반신반의했는데 실제 시험이랑 비슷하게 나와서 놀랐음.",
          name: "김○○",
          info: "경영학 4학년",
          emoji: "💬",
        },
      ],
    },
    features: {
      title: "이런 것도 됩니다",
      items: [
        { emoji: "🔗", title: "분석 결과 공유", desc: "링크 하나로 친구한테 공유 가능. '야 이 과목 분석한거 봐'" },
        { emoji: "📅", title: "AI 학습 플랜", desc: "시험 날짜 입력하면 오늘부터 D-day까지 공부 계획 자동 생성" },
        { emoji: "🧩", title: "지식 그래프", desc: "여러 강의 개념들이 어떻게 연결되는지 시각화" },
        { emoji: "💾", title: "오답노트", desc: "틀린 문제 자동 저장. 나중에 몰아서 복습 가능" },
        { emoji: "🔥", title: "스트릭", desc: "매일 퀴즈 풀면 스트릭 쌓임. 게임처럼 하다보면 습관이 됨" },
        { emoji: "📱", title: "모바일 지원", desc: "폰에서도 써도 됨. 강의실에서 바로 업로드 가능" },
      ],
    },
    story: {
      title: "왜 만들었냐면",
      body: "저도 매번 시험 전날 슬라이드 80장 다시 읽다가 지쳐서 만들었어요.\n어차피 AI가 요약해줄 수 있는데 왜 직접 읽고 있냐 싶어서.",
      name: "— 홍대 컴공 3학년",
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
    before_after: {
      title: "The difference is real",
      before: {
        label: "BEFORE",
        items: [
          "Re-reading 80 slides from the start",
          "Highlighting without knowing what matters",
          "Starting at midnight before the exam",
          "No idea where questions will come from",
        ],
      },
      after: {
        label: "AFTER",
        items: [
          "Upload PDF → 7 key concepts extracted automatically",
          "AI generates OX and multiple-choice quizzes instantly",
          "Wrong answers saved to mistake log automatically",
          "Predicted exam score calculated for you",
        ],
      },
    },
    stats: [
      { value: "8s", label: "Avg. analysis time" },
      { value: "5+", label: "Features" },
      { value: "Free", label: "Basic plan" },
      { value: "100%", label: "AI powered" },
    ],
    how: {
      title: "How it works",
      steps: [
        { num: "01", emoji: "📄", title: "Upload PDF", desc: "Drag and drop your lecture file. Done in 8 seconds." },
        { num: "02", emoji: "🧠", title: "AI analyzes", desc: "Key concepts, lecture flow, and exam points extracted automatically." },
        { num: "03", emoji: "🎯", title: "Take a quiz", desc: "AI-generated OX and multiple choice questions to test your understanding." },
        { num: "04", emoji: "📊", title: "Score prediction", desc: "See what score you'd likely get on the actual exam right now." },
      ],
    },
    testimonials: {
      title: "From people who actually used it",
      items: [
        {
          text: "Used it the night before my networks midterm. Instantly knew what to focus on. It felt like summarizing 70 slides in 30 minutes.",
          name: "L.J.",
          info: "CS junior",
          emoji: "💬",
        },
        {
          text: "The automatic mistake log is genuinely useful. I can review all my wrong answers later in one go.",
          name: "P.S.",
          info: "EE sophomore",
          emoji: "💬",
        },
        {
          text: "The score prediction feature surprised me — it was actually close to my real score. Kind of scary how accurate it was.",
          name: "K.M.",
          info: "Business senior",
          emoji: "💬",
        },
      ],
    },
    features: {
      title: "More things it can do",
      items: [
        { emoji: "🔗", title: "Share results", desc: "One link to share your analysis with friends." },
        { emoji: "📅", title: "AI study plan", desc: "Enter exam date → auto-generates daily study plan up to D-day." },
        { emoji: "🧩", title: "Knowledge graph", desc: "Visualize how concepts across lectures connect to each other." },
        { emoji: "💾", title: "Mistake log", desc: "Wrong answers saved automatically. Review them all later." },
        { emoji: "🔥", title: "Streaks", desc: "Daily quiz streaks. Feels like a game, works like studying." },
        { emoji: "📱", title: "Mobile", desc: "Works on phone too. Upload right from the classroom." },
      ],
    },
    story: {
      title: "Why I built this",
      body: "I was tired of re-reading 80 slides the night before every exam.\nIf AI can summarize it, why am I still doing it manually?",
      name: "— CS junior, Hongik University",
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
      <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100 bg-white/90 px-4 md:px-10 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-lg font-black tracking-tight text-gray-900">UniMind</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setLang(l => l === "ko" ? "en" : "ko")} className="rounded-lg px-2 py-1 text-xs md:text-sm text-gray-400 hover:text-gray-600 transition-colors">
            {lang === "ko" ? "EN" : "KR"}
          </button>
          <Link href="/dashboard" className="hidden md:block">
            <button className="rounded-xl px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {t.nav.browse}
            </button>
          </Link>
          <button onClick={handleLogin} disabled={loading} className="rounded-xl bg-gray-900 px-3 md:px-4 py-1.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors disabled:opacity-50">
            {loading ? t.loading : t.nav.login}
          </button>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="mb-5 inline-block rounded-full border border-purple-200 bg-purple-50 px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium text-purple-700">
          {t.hero.badge}
        </div>
        <h1 className="mb-6 text-4xl md:text-7xl font-black leading-[1.05] tracking-tighter text-gray-900">
          {t.hero.h1.map((line, i) => (
            <span key={i} className={`block ${i === 1 ? "text-purple-600" : ""}`}>{line}</span>
          ))}
        </h1>
        <p className="mb-8 max-w-xl text-base md:text-lg text-gray-500 leading-relaxed">{t.hero.sub}</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button onClick={handleLogin} disabled={loading} className="flex items-center justify-center gap-3 rounded-2xl bg-gray-900 px-6 md:px-7 py-4 text-base font-bold text-white shadow-lg hover:bg-gray-700 transition-all hover:-translate-y-0.5 disabled:opacity-50">
            <GoogleIcon />
            {loading ? t.loading : t.hero.cta}
          </button>
          <Link href="/dashboard" className="flex">
            <button className="flex-1 rounded-2xl border-2 border-gray-200 px-6 md:px-7 py-4 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
              {t.nav.browse} →
            </button>
          </Link>
        </div>
        <p className="mt-3 text-xs md:text-sm text-gray-400">{t.hero.sub2}</p>
        <a href="https://www.producthunt.com/posts/unimind-2" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block">
          <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=unimind-2&theme=light" alt="UniMind on Product Hunt" style={{ width: 180, height: 39 }} />
        </a>
      </section>

      {/* 통계 바 */}
      <section className="border-y border-gray-100 bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {t.stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl md:text-3xl font-black text-purple-600">{value}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Before / After */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-16 md:py-20">
        <h2 className="mb-10 text-2xl md:text-3xl font-black text-gray-900">{t.before_after.title}</h2>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Before */}
          <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-5 md:p-6">
            <span className="inline-block mb-4 rounded-lg bg-red-100 px-3 py-1 text-xs font-black text-red-500 tracking-widest">
              {t.before_after.before.label}
            </span>
            <ul className="space-y-3">
              {t.before_after.before.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-red-300 mt-0.5 flex-shrink-0">✗</span>
                  <span className="text-sm md:text-base text-gray-600 line-through">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* After */}
          <div className="rounded-2xl border-2 border-green-100 bg-green-50 p-5 md:p-6">
            <span className="inline-block mb-4 rounded-lg bg-green-100 px-3 py-1 text-xs font-black text-green-600 tracking-widest">
              {t.before_after.after.label}
            </span>
            <ul className="space-y-3">
              {t.before_after.after.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-sm md:text-base text-gray-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 작동 방식 */}
      <section className="bg-gray-50 px-4 md:px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-2xl md:text-3xl font-black text-gray-900">{t.how.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {t.how.steps.map(({ num, emoji, title, desc }) => (
              <div key={num} className="group rounded-2xl bg-white border-2 border-gray-100 p-5 md:p-6 hover:border-purple-200 hover:shadow-md transition-all">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-sm font-black text-purple-200 group-hover:text-purple-400 transition-colors">{num}</span>
                </div>
                <p className="mb-2 font-bold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 후기 */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-16 md:py-20">
        <h2 className="mb-10 text-2xl md:text-3xl font-black text-gray-900">{t.testimonials.title}</h2>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {t.testimonials.items.map(({ text, name, info, emoji }) => (
            <div key={name} className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-2xl mb-4 block">{emoji}</span>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-5">"{text}"</p>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{info}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 기능 그리드 */}
      <section className="bg-gray-900 px-4 md:px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-2xl md:text-3xl font-black text-white">{t.features.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.features.items.map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/8 transition-colors">
                <span className="text-2xl mb-3 block">{emoji}</span>
                <p className="font-bold text-white mb-1">{title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 만든 이유 */}
      <section className="border-b border-gray-100 bg-gray-50 px-4 md:px-6 py-12 md:py-14">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-500">{t.story.title}</p>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium whitespace-pre-line">
            "{t.story.body}"
          </p>
          <p className="mt-4 text-sm text-gray-400">{t.story.name}</p>
        </div>
      </section>

      {/* 스트릭 */}
      <section className="border-b border-gray-100 px-4 py-10 md:py-12">
        <div className="mx-auto max-w-sm text-center">
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

      {/* CTA */}
      <section className="px-4 py-20 md:py-28 text-center">
        <h2 className="mb-4 text-3xl md:text-5xl font-black text-gray-900">{t.cta2.title}</h2>
        <p className="mb-10 text-base md:text-lg text-gray-400">{t.cta2.sub}</p>
        <button onClick={handleLogin} disabled={loading} className="inline-flex items-center gap-3 rounded-2xl bg-purple-600 px-8 md:px-10 py-4 md:py-5 text-lg md:text-xl font-black text-white shadow-xl hover:bg-purple-700 transition-all hover:-translate-y-0.5 disabled:opacity-50">
          <GoogleIcon />
          {loading ? t.loading : t.cta2.btn}
        </button>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">🧠</span>
          <span className="font-black text-gray-900">UniMind</span>
        </div>
        <p className="text-sm text-gray-400">{t.footer}</p>
      </footer>
    </div>
  )
}
