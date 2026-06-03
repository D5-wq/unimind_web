"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const COPY = {
  ko: {
    nav: { browse: "둘러보기", login: "시작하기" },
    hero: {
      badge: "AI 스코어링 엔진",
      h1: "공부는 다 한 것 같은데,\n왜 불안할까요?",
      sub: "100장의 슬라이드 속 숨은 구멍을\nAI가 30초 만에 찾아냅니다.",
      cta: "무료로 내 점수 진단하기",
      sub2: "신용카드 불필요 · 월 5회 무료",
    },
    demo: {
      title: "이렇게 나옵니다",
      filename: "컴퓨터네트워크_7주차.pdf",
      stats: [{ label: "분석 시간", value: "35초" }, { label: "핵심 개념", value: "12개" }, { label: "퀴즈", value: "40문제" }],
      score: "72점",
      score_label: "예상 점수",
      weak_label: "집중 공부 필요",
      weak: ["Congestion Control", "TCP Flow Control", "DNS Resolution"],
      strong_label: "잘 하고 있어요",
      strong: ["3-Way Handshake", "IP Routing"],
    },
    value: {
      title: "PDF 요약기가 아닙니다",
      items: [
        {
          bad: "AI 퀴즈 생성",
          good: "인지적 사각지대를 탐지합니다. 외운 줄 알았던 개념부터.",
          emoji: "🎯",
        },
        {
          bad: "AI 학습 플랜",
          good: "시험까지 남은 일수 기준, 오늘 공부할 항목을 계산합니다.",
          emoji: "📅",
        },
        {
          bad: "오답노트",
          good: "실수 패턴을 추적합니다. 같은 개념에서 두 번 틀리지 않도록.",
          emoji: "📝",
        },
        {
          bad: "시험 점수 예측",
          good: "현재 이해도를 수치화합니다. 예상 점수와 근거를 함께 제공합니다.",
          emoji: "📊",
        },
      ],
    },
    before_after: {
      title: "달라지는 시험 준비",
      before: {
        label: "지금까지",
        items: [
          "슬라이드 100장 처음부터 다시 읽기",
          "뭐가 중요한지 모른 채로 밑줄",
          "외웠다고 생각했는데 시험에서 틀리기",
          "어디서 문제 나올지 감도 없음",
        ],
      },
      after: {
        label: "UniMind로",
        items: [
          "PDF 올리면 핵심 개념 자동 추출",
          "AI 퀴즈로 진짜 이해도 확인",
          "취약 개념만 집중 복습",
          "예상 점수 보고 전략적으로 준비",
        ],
      },
    },
    testimonials: {
      title: "실제로 쓴 사람들",
      items: [
        {
          text: "컴퓨터네트워크 중간고사 준비할 때 썼는데, 슬라이드 70장에서 취약 개념 4개 바로 잡아줬어요. 그 중 2개가 실제 시험에 나왔음.",
          name: "이○○",
          info: "홍익대학교 컴퓨터공학과 3학년",
        },
        {
          text: "예상 점수 기능이 실제 시험이랑 비슷하게 나와서 놀랐어요. 처음엔 반신반의했는데 두 번 써보니까 제법 맞음.",
          name: "김○○",
          info: "서울대학교 경영학과 4학년",
        },
        {
          text: "시험 전날 PDF 올렸는데 오늘 뭐 공부해야 하는지 바로 나와서 편했어요. 목록 보고 그냥 그대로 했음.",
          name: "박○○",
          info: "연세대학교 전자전기공학부 2학년",
        },
      ],
    },
    story: {
      q: "왜 만들었냐면",
      a: "시험기간마다 슬라이드 100장 읽고, 뭐가 중요한지 모르고, 외웠다고 생각했는데 틀리는 걸 반복했어요.\n\"AI가 대신 분석해주면 안 되나?\" 에서 시작했습니다.",
      name: "— 홍대 컴공 3학년",
    },
    cta2: {
      title: "지금 바로 진단하세요.",
      sub: "30초. 취약 개념과 예상 점수가 나옵니다.",
      btn: "무료로 내 점수 진단하기",
    },
    footer: "Data-driven Study Strategy · UniMind",
    loading: "잠깐만요...",
  },
  en: {
    nav: { browse: "Browse", login: "Get started" },
    hero: {
      badge: "AI Scoring Engine",
      h1: "You studied.\nSo why does it still\nfeel uncertain?",
      sub: "AI detects the gaps in 100 slides\nin under 30 seconds.",
      cta: "Diagnose my score for free",
      sub2: "No credit card · 5 free analyses/month",
    },
    demo: {
      title: "Here's what you get",
      filename: "computer_networks_week7.pdf",
      stats: [{ label: "Analysis time", value: "35s" }, { label: "Key concepts", value: "12" }, { label: "Quiz questions", value: "40" }],
      score: "72",
      score_label: "Predicted score",
      weak_label: "Needs work",
      weak: ["Congestion Control", "TCP Flow Control", "DNS Resolution"],
      strong_label: "Looking good",
      strong: ["3-Way Handshake", "IP Routing"],
    },
    value: {
      title: "Not features. Results.",
      items: [
        { bad: "AI extracts key concepts", good: "See only what matters from 80 slides — in 3 minutes", emoji: "📄" },
        { bad: "Auto-save wrong answers", good: "Track every mistake so you never repeat it", emoji: "🎯" },
        { bad: "AI study plan", good: "Know exactly what to study today based on your exam date", emoji: "📅" },
        { bad: "Exam score prediction", good: "Real score estimate from quiz results and comprehension data", emoji: "📊" },
      ],
    },
    before_after: {
      title: "A different way to prepare",
      before: {
        label: "Without UniMind",
        items: [
          "Re-reading 100 slides from scratch",
          "Highlighting without knowing what matters",
          "Thinking you knew it, then getting it wrong",
          "No idea where exam questions come from",
        ],
      },
      after: {
        label: "With UniMind",
        items: [
          "Upload PDF → key concepts extracted instantly",
          "AI quizzes reveal what you actually know",
          "Focus only on weak spots",
          "Know your predicted score before the exam",
        ],
      },
    },
    testimonials: {
      title: "From people who used it",
      items: [
        { text: "Used it the night before my networks midterm. Instantly knew what to focus on. It felt like summarizing 70 slides in 30 minutes.", name: "L.J.", info: "CS junior" },
        { text: "The score prediction surprised me — it was actually close to my real exam score. Kind of scary how accurate it was.", name: "K.M.", info: "Business senior" },
        { text: "The automatic mistake log is genuinely useful. I can review all my wrong answers in one go later.", name: "P.S.", info: "EE sophomore" },
      ],
    },
    story: {
      q: "Why I built this",
      a: "Every exam season: re-read 100 slides, not know what's important, think I knew it, get it wrong anyway.\n\"Can't AI just analyze this for me?\" — that's where it started.",
      name: "— CS junior, Hongik University",
    },
    cta2: {
      title: "Upload one lecture file today",
      sub: "8 seconds to key concepts, quizzes, and a predicted score.",
      btn: "Get started free",
    },
    footer: "Built during finals week by a CS junior at Hongik University",
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
    <div className="min-h-screen text-gray-900" style={{ background: "radial-gradient(ellipse 80% 60% at 60% 0%, rgba(124,58,237,0.08) 0%, transparent 60%), #ffffff" }}>

      {/* 네비 */}
      <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100 bg-white/90 px-4 md:px-10 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight text-gray-900">UniMind</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setLang(l => l === "ko" ? "en" : "ko")} className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {lang === "ko" ? "EN" : "KR"}
          </button>
          <Link href="/dashboard" className="hidden md:block">
            <button className="rounded-xl px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">내 대시보드 →</button>
          </Link>
          <button onClick={handleLogin} disabled={loading} className="rounded-xl bg-gray-900 px-3 md:px-4 py-1.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors disabled:opacity-50">
            {loading ? t.loading : t.nav.login}
          </button>
        </div>
      </nav>

      {/* 히어로 — 분할 레이아웃 */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 pt-14 md:pt-20 pb-12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* 왼쪽: 텍스트 */}
          <div>
            <div className="mb-5 inline-block rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">
              {t.hero.badge}
            </div>
            <h1 className="mb-5 text-4xl md:text-5xl font-black leading-[1.08] tracking-tighter text-gray-900 whitespace-pre-line">
              {t.hero.h1}
            </h1>
            <p className="mb-8 text-base text-gray-500 leading-relaxed whitespace-pre-line">
              {t.hero.sub}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleLogin} disabled={loading} className="flex items-center justify-center gap-3 rounded-2xl bg-gray-900 px-7 py-4 text-base font-bold text-white shadow-lg hover:bg-gray-700 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                <GoogleIcon />
                {loading ? t.loading : t.hero.cta}
              </button>
              <Link href="/sample" className="flex">
                <button className="flex-1 rounded-2xl border-2 border-gray-200 px-7 py-4 text-base font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  샘플 결과 보기 →
                </button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-gray-400">{t.hero.sub2}</p>
            <a href="https://www.producthunt.com/posts/unimind-2" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block">
              <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=unimind-2&theme=light" alt="UniMind on Product Hunt" style={{ width: 180, height: 39 }} />
            </a>
          </div>

          {/* 오른쪽: 프리미엄 목업 */}
          <div className="relative hidden md:block">
            {/* 배경 glow */}
            <div className="absolute inset-0 -z-10 rounded-3xl bg-purple-400/20 blur-3xl scale-110" />

            {/* 메인 카드 — 글래스모피즘 */}
            <div className="rounded-3xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* 상단 파일명 바 */}
              <div className="flex items-center gap-2 border-b border-gray-100/60 bg-white/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-[11px] text-gray-400 ml-1.5">컴퓨터네트워크_7주차.pdf</span>
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-600 tracking-wide">분석 완료</span>
              </div>

              <div className="p-5 grid grid-cols-2 gap-3">
                {/* 도넛 차트 점수 카드 */}
                <div className="col-span-1 rounded-2xl p-4 flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)" }}>
                  <p className="text-[10px] text-purple-200 font-semibold mb-2 tracking-wider uppercase">예상 점수</p>
                  {/* SVG 도넛 차트 */}
                  <div className="relative">
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r="35" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                      <circle cx="45" cy="45" r="35" fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 35 * 0.72} ${2 * Math.PI * 35 * 0.28}`}
                        strokeDashoffset={2 * Math.PI * 35 * 0.25}
                        strokeLinecap="round"
                        transform="rotate(-90 45 45)"
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#A78BFA" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white leading-none">72</span>
                      <span className="text-[9px] text-purple-200 font-medium">점</span>
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] text-purple-200">상위 25%</span>
                </div>

                {/* 우측 카드들 */}
                <div className="col-span-1 space-y-2.5">
                  {/* 집중 필요 */}
                  <div className="rounded-xl bg-red-50/80 border border-red-100/60 p-2.5">
                    <p className="text-[9px] font-bold text-red-500 mb-1.5 uppercase tracking-wider">집중 필요</p>
                    {["Congestion Control", "Flow Control", "DNS"].map(c => (
                      <div key={c} className="flex items-center gap-1.5 py-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-[10px] text-gray-700 truncate">{c}</span>
                      </div>
                    ))}
                  </div>
                  {/* 오늘 공부할 것 */}
                  <div className="rounded-xl bg-white/60 border border-gray-100/60 p-2.5">
                    <p className="text-[9px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">오늘 공부할 것</p>
                    {["Sliding Window", "TCP State Machine", "3-Way Handshake"].map((item, i) => (
                      <div key={item} className="flex items-center gap-1.5 py-0.5">
                        <span className="text-[9px] font-black text-purple-500 w-3">{i + 1}</span>
                        <span className="text-[10px] text-gray-700 truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 퀴즈 버튼 — 전체 너비 */}
                <div className="col-span-2 rounded-2xl py-3 text-center cursor-pointer" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)" }}>
                  <span className="text-[11px] font-black text-white tracking-wide">퀴즈 40문제 시작 →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 실제 결과 데모 */}
      <section className="bg-gray-50 border-y border-gray-100 px-4 md:px-6 py-14 md:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-6 text-sm font-bold uppercase tracking-widest text-purple-500">{t.demo.title}</p>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
            {/* 파일 헤더 */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
              <span className="text-lg">📄</span>
              <span className="text-sm font-medium text-gray-600">{t.demo.filename}</span>
              <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-600">분석 완료</span>
            </div>
            <div className="p-5 md:p-6">
              {/* 통계 */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {t.demo.stats.map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className="text-xl md:text-2xl font-black text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {/* 점수 예측 */}
              <div className="mb-4 flex items-center gap-4 rounded-2xl bg-purple-50 border border-purple-100 p-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white">
                  <div className="text-center">
                    <p className="text-2xl font-black">{t.demo.score}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-purple-500 font-medium mb-0.5">{t.demo.score_label}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">지금 이해도 기준으로 계산한 예상 점수예요</p>
                </div>
              </div>
              {/* 취약 개념 */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="text-xs font-bold text-red-500 mb-2">{t.demo.weak_label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.demo.weak.map(w => (
                      <span key={w} className="rounded-lg bg-red-100 text-red-600 text-xs px-2 py-0.5 font-medium">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                  <p className="text-xs font-bold text-green-600 mb-2">{t.demo.strong_label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.demo.strong.map(s => (
                      <span key={s} className="rounded-lg bg-green-100 text-green-600 text-xs px-2 py-0.5 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 말고 결과 */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-16 md:py-20">
        <h2 className="mb-10 text-2xl md:text-3xl font-black text-gray-900">{t.value.title}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {t.value.items.map(({ bad, good, emoji }) => (
            <div key={bad} className="rounded-2xl border border-gray-100 p-5 hover:border-purple-200 hover:shadow-sm transition-all">
              <span className="text-2xl mb-4 block">{emoji}</span>
              <p className="text-xs text-gray-400 line-through mb-2">{bad}</p>
              <p className="text-base font-bold text-gray-900 leading-snug">{good}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Before / After */}
      <section className="bg-gray-50 border-y border-gray-100 px-4 md:px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-2xl md:text-3xl font-black text-gray-900">{t.before_after.title}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-5 md:p-6">
              <span className="inline-block mb-4 rounded-lg bg-red-100 px-3 py-1 text-xs font-black text-red-500 tracking-widest">{t.before_after.before.label}</span>
              <ul className="space-y-3">
                {t.before_after.before.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-red-300 mt-0.5 flex-shrink-0">✗</span>
                    <span className="text-sm text-gray-600 line-through">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-green-100 bg-green-50 p-5 md:p-6">
              <span className="inline-block mb-4 rounded-lg bg-green-100 px-3 py-1 text-xs font-black text-green-600 tracking-widest">{t.before_after.after.label}</span>
              <ul className="space-y-3">
                {t.before_after.after.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 신뢰 섹션 — 예상 점수 계산 방식 */}
      <section className="bg-gray-50 border-y border-gray-100 px-4 md:px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-3">왜 믿어야 하나요?</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-8">예상 점수 계산 방식</h2>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              {[
                { label: "퀴즈 정답률", value: "78%", color: "text-green-600 bg-green-500/10", desc: "AI 퀴즈에서 맞춘 비율" },
                { label: "이해한 개념", value: "12개", color: "text-primary bg-primary/10", desc: "직접 체크한 이해 개념 수" },
                { label: "헷갈리는 개념", value: "3개", color: "text-orange-500 bg-orange-500/10", desc: "복습 필요로 표시한 개념" },
                { label: "D-Day 보정", value: "D-6", color: "text-destructive bg-destructive/10", desc: "시험까지 남은 시간 반영" },
              ].map(({ label, value, color, desc }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3">
                  <span className={`rounded-lg px-2.5 py-1 text-sm font-black ${color}`}>{value}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-purple-600 p-8 text-white">
              <p className="text-sm text-purple-200 mb-3">종합 예상 점수</p>
              <span className="text-7xl font-black leading-none">72</span>
              <span className="text-2xl text-purple-300 mt-1">점</span>
              <p className="text-xs text-purple-200 mt-4 text-center">퀴즈 결과 + 이해도 + D-Day를<br />종합해서 계산합니다</p>
            </div>
          </div>
        </div>
      </section>

      {/* 후기 */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-16 md:py-20">
        <h2 className="mb-10 text-2xl md:text-3xl font-black text-gray-900">{t.testimonials.title}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {t.testimonials.items.map(({ text, name, info }) => (
            <div key={name} className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed mb-5">"{text}"</p>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">{name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{info}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 만든 이유 */}
      <section className="bg-gray-900 px-4 md:px-6 py-14 md:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-purple-400">{t.story.q}</p>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed whitespace-pre-line font-medium">"{t.story.a}"</p>
          <p className="mt-5 text-sm text-gray-500">{t.story.name}</p>
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
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600">
            <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-black text-gray-900">UniMind</span>
        </div>
        <p className="text-sm text-gray-400">{t.footer}</p>
      </footer>
    </div>
  )
}
