"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LandingPage() {
  const [loginLoading, setLoginLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoginLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const features = [
    { emoji: "📄", title: "PDF 올리기", desc: "강의 자료를 던지면", color: "bg-yellow-400", border: "border-yellow-500" },
    { emoji: "🧠", title: "AI가 정리", desc: "핵심 개념을 뽑아줌", color: "bg-blue-400", border: "border-blue-500" },
    { emoji: "🎯", title: "퀴즈 자동생성", desc: "OX, 4지선다 뚝딱", color: "bg-green-400", border: "border-green-500" },
    { emoji: "📊", title: "시험 점수 예측", desc: "지금 상태면 몇 점?", color: "bg-pink-400", border: "border-pink-500" },
  ]

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>

      {/* 헤더 */}
      <header className="flex h-16 w-full items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xl shadow-[3px_3px_0px_#00000030]">
            🧠
          </div>
          <span className="text-xl font-black text-white tracking-tight">UniMind</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="rounded-2xl border-2 border-white/40 bg-white/20 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
              둘러보기
            </button>
          </Link>
          <button
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="rounded-2xl border-2 border-white bg-white px-4 py-1.5 text-sm font-black text-purple-700 shadow-[3px_3px_0px_#ffffff60] hover:translate-y-px hover:shadow-[2px_2px_0px_#ffffff60] transition-all disabled:opacity-60"
          >
            {loginLoading ? "로딩..." : "로그인"}
          </button>
        </div>
      </header>

      {/* 히어로 */}
      <section className="flex flex-col items-center justify-center px-4 pb-16 pt-12 text-center">

        {/* 배지 */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-white/50 bg-white/20 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
          ⚡ AI 강의 학습 코치
        </div>

        {/* 메인 타이틀 */}
        <h1 className="mb-4 text-5xl md:text-7xl font-black leading-tight tracking-tight text-white drop-shadow-lg">
          공부를<br />
          <span className="relative inline-block">
            <span className="relative z-10 text-yellow-300">AI한테 맡겨</span>
            <span className="absolute -bottom-1 left-0 right-0 h-3 rounded-full bg-yellow-500/40 blur-sm" />
          </span>
        </h1>

        <p className="mb-10 max-w-md text-lg font-medium text-white/80 leading-relaxed">
          PDF 업로드 → 개념 정리 → 퀴즈 → 시험 점수 예측<br />
          밤새우는 일 없애드립니다 🌙
        </p>

        {/* CTA 버튼들 */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="group flex items-center gap-3 rounded-3xl border-4 border-white bg-white px-8 py-4 text-lg font-black text-purple-700 shadow-[5px_5px_0px_#ffffff50] hover:translate-y-1 hover:shadow-[3px_3px_0px_#ffffff50] transition-all disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loginLoading ? "잠깐만요..." : "Google로 무료 시작"}
          </button>

          <Link href="/dashboard">
            <button className="flex items-center gap-2 rounded-3xl border-4 border-white/50 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
              먼저 둘러보기 <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
        <p className="text-sm text-white/60 font-medium">신용카드 불필요 · 월 5회 무료</p>

        {/* 스탯 블록들 */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: "8초", l: "평균 분석 시간", bg: "bg-yellow-400", emoji: "⚡" },
            { v: "무료", l: "기본 사용", bg: "bg-green-400", emoji: "🎁" },
            { v: "∞", l: "퀴즈 문제", bg: "bg-blue-400", emoji: "🎯" },
            { v: "100%", l: "AI 기반", bg: "bg-pink-400", emoji: "🤖" },
          ].map(({ v, l, bg, emoji }) => (
            <div key={l} className={`${bg} rounded-3xl border-4 border-white/60 px-6 py-5 text-center shadow-[4px_4px_0px_#00000020]`}>
              <div className="text-2xl mb-1">{emoji}</div>
              <p className="text-3xl font-black text-white drop-shadow">{v}</p>
              <p className="text-xs font-bold text-white/80 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 기능 블록 */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">이렇게 작동해요</h2>
            <p className="text-white/70 font-medium">업로드 한 번으로 4가지가 자동으로</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map(({ emoji, title, desc, color, border }) => (
              <div key={title} className={`${color} rounded-3xl border-4 ${border} p-5 text-center shadow-[5px_5px_0px_#00000020] hover:-translate-y-1 hover:shadow-[5px_8px_0px_#00000020] transition-all cursor-default`}>
                <div className="text-4xl mb-3">{emoji}</div>
                <p className="font-black text-white text-base">{title}</p>
                <p className="text-xs font-medium text-white/80 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 스트릭 섹션 */}
      <section className="px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="rounded-3xl border-4 border-white/30 bg-white/15 p-8 backdrop-blur-sm shadow-[6px_6px_0px_#00000020]">
            <div className="text-5xl mb-4">🔥</div>
            <h2 className="text-2xl font-black text-white mb-2">매일 퀴즈로 스트릭 쌓기</h2>
            <p className="text-white/70 font-medium mb-6">연속 학습이 습관이 되고, 습관이 성적이 돼요</p>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5,6,7].map(d => (
                <div key={d} className={`flex h-11 w-11 items-center justify-center rounded-2xl border-3 text-lg font-black shadow-[3px_3px_0px_#00000020] ${d <= 5 ? "border-orange-400 bg-orange-400 text-white" : "border-white/30 bg-white/20 text-white/50"}`}>
                  {d <= 5 ? "🔥" : d}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 최하단 CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">지금 바로 시작해요</h2>
        <p className="text-white/70 font-medium mb-8">기말 전에 써봐야 효과 있어요 📚</p>
        <button
          onClick={handleGoogleLogin}
          disabled={loginLoading}
          className="rounded-3xl border-4 border-white bg-white px-10 py-4 text-xl font-black text-purple-700 shadow-[6px_6px_0px_#ffffff40] hover:translate-y-1 hover:shadow-[4px_4px_0px_#ffffff40] transition-all disabled:opacity-60"
        >
          {loginLoading ? "로딩 중..." : "무료로 시작하기 🚀"}
        </button>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-white/20 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🧠</span>
          <span className="font-black text-white text-lg">UniMind</span>
        </div>
        <p className="text-sm text-white/50 font-medium">AI 학습 코치 · 대학생을 위한 공부 도구</p>
      </footer>
    </div>
  )
}
