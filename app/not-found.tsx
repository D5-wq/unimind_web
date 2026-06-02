import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <div className="mb-6 text-8xl">🤔</div>
      <p className="mb-2 text-sm font-medium text-purple-600 uppercase tracking-widest">404</p>
      <h1 className="mb-4 text-4xl font-black text-gray-900">여기 아무것도 없어요</h1>
      <p className="mb-10 text-gray-400 max-w-sm leading-relaxed">
        링크가 잘못됐거나 삭제된 페이지예요.<br />
        공유된 분석이라면 만료됐을 수도 있어요.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard">
          <button className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors">
            대시보드로
          </button>
        </Link>
        <Link href="/">
          <button className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            홈으로
          </button>
        </Link>
      </div>
      <Link href="/" className="mt-12 flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
        <span className="text-xl">🧠</span>
        <span className="font-black text-gray-900">UniMind</span>
      </Link>
    </div>
  )
}
