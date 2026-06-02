"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"
import { Crown, Sparkles, Zap, Infinity } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function ProCelebration({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    // 처음 터짐
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#7C3AED", "#A855F7", "#F59E0B", "#10B981", "#3B82F6"],
    })

    // 0.3초 후 양쪽에서 터짐
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } })
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } })
    }, 300)

    // 1초 후 한 번 더
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.4 },
        colors: ["#F59E0B", "#EF4444", "#7C3AED"],
        scalar: 1.2,
      })
    }, 1000)

    // 3초 후 자동 닫기
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="relative mx-4 w-full max-w-sm rounded-3xl bg-gradient-to-br from-purple-600 to-purple-900 p-8 text-center shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* 반짝이는 배경 */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-yellow-300"
                style={{
                  left: `${15 + i * 14}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>

          {/* 왕관 아이콘 */}
          <motion.div
            animate={{ rotate: [-8, 8, -8], y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-400 text-yellow-900 mb-5 shadow-lg"
          >
            <Crown className="h-10 w-10" />
          </motion.div>

          <h2 className="text-3xl font-black text-white mb-2">Pro 업그레이드!</h2>
          <p className="text-purple-200 text-sm mb-6">이제 모든 기능을 제한 없이 쓸 수 있어요</p>

          {/* 혜택 목록 */}
          <div className="space-y-2.5 mb-6">
            {[
              { icon: Infinity, text: "무제한 PDF 분석" },
              { icon: Zap, text: "AI 학습 플랜 무제한" },
              { icon: Sparkles, text: "시험 예측 엔진 풀 기능" },
              { icon: Crown, text: "Pro 전용 배지" },
            ].map(({ icon: Icon, text }) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5"
              >
                <Icon className="h-4 w-4 text-yellow-300 flex-shrink-0" />
                <span className="text-sm font-medium text-white">{text}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full rounded-2xl bg-white py-3.5 text-base font-black text-purple-700 shadow-lg"
          >
            시작하기 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
