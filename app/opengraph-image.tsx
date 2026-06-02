import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "UniMind — AI 강의 학습 코치"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "sans-serif",
      }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🧠</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: "white", marginBottom: 16, letterSpacing: -2 }}>
          UniMind
        </div>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.8)", marginBottom: 48, fontWeight: 500 }}>
          시험 전날 밤새는 거 그만해도 돼
        </div>
        <div style={{
          display: "flex", gap: 16,
        }}>
          {["PDF 올리기", "AI 정리", "퀴즈", "점수 예측"].map((t, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: 16, padding: "12px 24px",
              color: "white", fontSize: 20, fontWeight: 700,
              border: "2px solid rgba(255,255,255,0.3)",
            }}>{t}</div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 32, color: "rgba(255,255,255,0.5)", fontSize: 18 }}>
          unimind-web.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
