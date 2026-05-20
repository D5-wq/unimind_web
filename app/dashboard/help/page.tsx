import { Header } from "@/components/dashboard/header"
import { Upload, Brain, MessageSquare, Network, GraduationCap, Calendar, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const steps = [
  {
    icon: Upload,
    title: "1. 강의 자료 업로드",
    desc: "PDF 또는 PPTX 파일을 업로드하면 AI가 자동으로 분석을 시작합니다.",
  },
  {
    icon: Brain,
    title: "2. 분석 결과 확인",
    desc: "강의 흐름, 핵심 개념, 시험 예상 포인트를 탭으로 확인하세요.",
  },
  {
    icon: Network,
    title: "3. 개념 맵 탐색",
    desc: "AI가 생성한 개념 그래프에서 개념 간 연결 관계를 시각적으로 파악하세요.",
  },
  {
    icon: MessageSquare,
    title: "4. AI에게 질문",
    desc: "이해가 안 되는 부분은 AI 채팅에서 바로 질문하세요. 강의 내용 기반으로 답변합니다.",
  },
  {
    icon: GraduationCap,
    title: "5. 시험 준비",
    desc: "시험 예상 포인트와 체크리스트로 시험을 체계적으로 준비하세요.",
  },
  {
    icon: Calendar,
    title: "6. D-Day 관리",
    desc: "오른쪽 패널의 + 버튼으로 시험 일정을 추가하고 D-Day를 확인하세요.",
  },
]

const faqs = [
  {
    q: "어떤 파일 형식을 지원하나요?",
    a: "PDF와 PPTX(파워포인트) 파일을 지원합니다. 파일 크기는 최대 50MB입니다.",
  },
  {
    q: "분석 결과가 정확하지 않아요.",
    a: "AI 분석은 강의 자료의 텍스트 품질에 따라 달라집니다. 스캔본보다 텍스트가 추출 가능한 PDF가 더 정확합니다.",
  },
  {
    q: "다른 기기에서 데이터를 볼 수 있나요?",
    a: "현재는 브라우저 로컬 저장소를 사용해서 같은 기기·같은 브라우저에서만 데이터가 유지됩니다.",
  },
  {
    q: "채팅 기록은 어디에 저장되나요?",
    a: "채팅 기록은 브라우저 로컬 저장소에 저장됩니다. 설정 페이지에서 초기화할 수 있습니다.",
  },
  {
    q: "강의 자료를 올리면 어디에 저장되나요?",
    a: "파일 자체는 저장되지 않습니다. AI가 분석한 결과(요약, 개념, 시험 포인트)만 브라우저에 저장됩니다.",
  },
]

export default function HelpPage() {
  return (
    <div className="flex flex-col">
      <Header title="도움말" subtitle="UniMind 사용 방법을 알아보세요" />

      <div className="flex-1 space-y-6 p-6 max-w-2xl">

        {/* 사용 방법 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">시작하는 방법</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step) => (
              <div key={step.title} className="flex items-start gap-4 rounded-xl bg-secondary/30 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">자주 묻는 질문</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium text-foreground">Q. {faq.q}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">A. {faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
