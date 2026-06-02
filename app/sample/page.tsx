import Link from "next/link"
import { ArrowLeft, Brain, Target, CheckCircle, HelpCircle, Sparkles, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// 하드코딩된 샘플 데이터 — 실제 분석 결과처럼 보이게
const SAMPLE = {
  fileName: "컴퓨터네트워크_7주차_TCP.pdf",
  oneLiner: "TCP의 신뢰성 전송 메커니즘과 혼잡 제어 전략",
  summary: "이 강의는 TCP가 어떻게 신뢰성 있는 데이터 전송을 보장하는지 다룹니다. 3-Way Handshake부터 혼잡 제어까지, 실제 네트워크에서 발생하는 문제들을 TCP가 어떻게 해결하는지 설명합니다.",
  predictedScore: 72,
  grade: "B+",
  percentile: "상위 21%",
  concepts: [
    { name: "3-Way Handshake", simple: "TCP 연결을 맺는 3단계 과정. SYN → SYN-ACK → ACK 순서로 연결 확립", difficulty: "기본", understood: true },
    { name: "Sliding Window", simple: "수신 측 버퍼 크기만큼 ACK 없이 연속 전송 가능한 흐름 제어 방식", difficulty: "핵심", understood: true },
    { name: "Congestion Control", simple: "네트워크 혼잡 감지 시 전송률을 줄여 전체 네트워크 성능 유지", difficulty: "심화", understood: false },
    { name: "TCP Flow Control", simple: "수신자가 처리 가능한 속도로 송신자를 제어하는 메커니즘", difficulty: "핵심", understood: false },
    { name: "Slow Start", simple: "연결 초기에 혼잡 윈도우를 지수적으로 증가시키는 알고리즘", difficulty: "심화", understood: false },
    { name: "ACK Mechanism", simple: "수신 확인 응답으로 패킷 전달 성공 여부를 송신자에게 알리는 방식", difficulty: "기본", understood: true },
    { name: "RTT(Round Trip Time)", simple: "패킷이 목적지까지 갔다가 돌아오는 시간. 타임아웃 계산 기준", difficulty: "기본", understood: true },
    { name: "TCP State Machine", simple: "LISTEN, SYN_SENT, ESTABLISHED 등 연결 상태 전이 다이어그램", difficulty: "핵심", understood: false },
  ],
  examPoints: [
    "3-Way Handshake 각 단계의 역할과 상태 전이를 설명할 수 있어야 함",
    "Sliding Window와 Flow Control의 차이점 — 둘 다 전송률 제어지만 목적이 다름",
    "혼잡 제어 4가지 알고리즘: Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery",
    "TCP Timeout 계산: EstimatedRTT = (1-α)·EstimatedRTT + α·SampleRTT",
  ],
  weakConcepts: ["Congestion Control", "TCP Flow Control", "Slow Start", "TCP State Machine"],
  strongConcepts: ["3-Way Handshake", "ACK Mechanism", "RTT"],
}

const DIFF_COLOR = (d: string) =>
  d === "심화" ? "bg-red-500/10 text-red-500 border-red-500/20" :
  d === "핵심" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
  "bg-primary/10 text-primary border-primary/20"

export default function SamplePage() {
  const understood = SAMPLE.concepts.filter(c => c.understood).length
  const confused = SAMPLE.concepts.filter(c => !c.understood).length

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Link>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-black text-sm text-foreground">UniMind</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">이게 실제 분석 결과예요</span>
            <Link href="/dashboard/upload">
              <button className="rounded-xl bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                내 PDF 분석하기
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 샘플 배너 */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center">
        <p className="text-xs text-amber-700 font-medium">
          📋 이것은 샘플 데이터입니다 — 실제로 PDF를 올리면 이런 결과가 나와요
          <Link href="/dashboard/upload" className="ml-2 underline font-bold">내 자료 분석하기 →</Link>
        </p>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* 점수 카드 */}
        <Card className="rounded-2xl border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="flex items-center gap-5 p-5 flex-1">
                <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/10 font-black text-primary">
                  <span className="text-2xl leading-none">{SAMPLE.grade}</span>
                  <span className="text-xs opacity-70">{SAMPLE.predictedScore}점</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">현재 이해도 기준 예상 점수</p>
                  <p className="font-bold text-foreground">{SAMPLE.oneLiner}</p>
                  <div className="mt-1.5 flex gap-2 flex-wrap">
                    <span className="rounded-lg bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{SAMPLE.percentile}</span>
                    <span className="rounded-lg bg-secondary px-2 py-0.5 text-xs text-muted-foreground">이해 {understood}/{SAMPLE.concepts.length}</span>
                    <span className="rounded-lg bg-orange-500/10 text-orange-600 px-2 py-0.5 text-xs">취약 {confused}개</span>
                  </div>
                </div>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-border bg-secondary/30 p-4 flex gap-3 md:w-56">
                <div className="flex-1 text-center rounded-xl bg-background p-2">
                  <p className="text-sm font-black text-green-600">+{understood * 12}점</p>
                  <p className="text-[10px] text-muted-foreground">이해 개념</p>
                </div>
                <div className="flex-1 text-center rounded-xl bg-background p-2">
                  <p className="text-sm font-black text-destructive">-{confused * 10}점</p>
                  <p className="text-[10px] text-muted-foreground">취약 개념</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 파일 정보 */}
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{SAMPLE.fileName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{SAMPLE.summary.slice(0, 80)}...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 취약 개념 */}
          <Card className="rounded-2xl border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <HelpCircle className="h-4 w-4" /> 집중 공부 필요
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SAMPLE.weakConcepts.map(c => (
                <div key={c} className="flex items-center gap-2 rounded-xl bg-destructive/5 px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
                  <span className="text-sm text-foreground">{c}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 잘 아는 개념 */}
          <Card className="rounded-2xl border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" /> 잘 하고 있어요
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SAMPLE.strongConcepts.map(c => (
                <div key={c} className="flex items-center gap-2 rounded-xl bg-green-500/5 px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-sm text-foreground">{c}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 핵심 개념 */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-primary" />
              핵심 개념 {SAMPLE.concepts.length}개
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SAMPLE.concepts.map(c => (
              <div key={c.name} className={`rounded-xl p-4 border ${c.understood ? "bg-primary/5 border-primary/20" : "bg-orange-500/5 border-orange-500/20"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {c.understood
                    ? <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    : <HelpCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  }
                  <span className="font-semibold text-sm text-foreground">{c.name}</span>
                  <Badge variant="outline" className={`rounded-lg text-xs ml-auto ${DIFF_COLOR(c.difficulty)}`}>{c.difficulty}</Badge>
                </div>
                <p className="text-xs text-muted-foreground ml-6">{c.simple}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 시험 포인트 */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-destructive" />
              시험 포인트 {SAMPLE.examPoints.length}개
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SAMPLE.examPoints.map((p, i) => (
              <div key={i} className="flex gap-3 rounded-xl bg-secondary/30 p-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">{i + 1}</span>
                <p className="text-sm text-foreground leading-relaxed">{p}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="rounded-2xl bg-primary p-8 text-center text-primary-foreground">
          <p className="text-2xl font-black mb-2">내 강의 자료로 해볼까요?</p>
          <p className="text-primary-foreground/80 mb-6 text-sm">PDF 올리면 8초 만에 이런 결과가 나와요. 무료예요.</p>
          <Link href="/dashboard/upload">
            <button className="rounded-2xl bg-white px-8 py-4 text-base font-black text-primary hover:bg-white/90 transition-all hover:-translate-y-0.5 shadow-lg">
              내 PDF 분석하기 →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
