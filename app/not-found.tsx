import Link from "next/link"
import { Sparkles, Home, Upload, ArrowRight } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* 로고 */}
      <Link href="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">UniMind</span>
      </Link>

      {/* 404 */}
      <div className="text-8xl font-black text-primary/20 leading-none mb-4">404</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-muted-foreground mb-10 max-w-sm leading-relaxed">
        링크가 잘못됐거나 삭제된 페이지예요.<br />
        공유된 강의 분석이라면 만료됐을 수 있어요.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Home className="h-4 w-4" />
            대시보드로 돌아가기
          </button>
        </Link>
        <Link href="/dashboard/upload">
          <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <Upload className="h-4 w-4" />
            강의 분석 시작하기
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    </div>
  )
}
