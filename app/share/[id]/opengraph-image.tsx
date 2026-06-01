import { ImageResponse } from "next/og"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"
export const alt = "UniMind 강의 분석"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data } = await supabase
    .from("analyses")
    .select("one_liner, file_name, concepts, exam_points")
    .eq("id", id)
    .single()

  const title = data?.one_liner ?? "강의 분석 결과"
  const fileName = data?.file_name ?? ""
  const conceptCount = (data?.concepts as any[])?.length ?? 0
  const examCount = (data?.exam_points as any[])?.length ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: 48, height: 48,
            borderRadius: 14,
            background: "#6366f1",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>✦</div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "white" }}>UniMind</span>
        </div>

        {/* 메인 텍스트 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {fileName && (
            <span style={{ fontSize: 18, color: "#94a3b8", fontWeight: 400 }}>
              {fileName.length > 50 ? fileName.slice(0, 50) + "…" : fileName}
            </span>
          )}
          <div style={{
            fontSize: title.length > 40 ? 38 : 48,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            maxWidth: 900,
          }}>
            {title.length > 60 ? title.slice(0, 60) + "…" : title}
          </div>
        </div>

        {/* 하단 메타 */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "rgba(99,102,241,0.2)",
            borderRadius: 12, padding: "10px 20px",
          }}>
            <span style={{ fontSize: 20 }}>🧠</span>
            <span style={{ color: "#c7d2fe", fontSize: 18, fontWeight: 600 }}>핵심 개념 {conceptCount}개</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "rgba(239,68,68,0.15)",
            borderRadius: 12, padding: "10px 20px",
          }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <span style={{ color: "#fca5a5", fontSize: 18, fontWeight: 600 }}>시험 포인트 {examCount}개</span>
          </div>
          <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 16 }}>
            unimind-web.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
