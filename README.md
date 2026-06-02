# UniMind 🧠

시험 전날 슬라이드 80장 다시 읽다가 지쳐서 만들었습니다.

**강의 PDF 올리면 AI가 핵심 개념 정리하고, 퀴즈 만들어주고, 지금 이해도면 시험 몇 점 나올지 알려줘요.**

🔗 **[unimind-web.vercel.app](https://unimind-web.vercel.app)**

---

## 뭐가 되냐면

- PDF/PPTX 올리면 핵심 개념 자동 정리
- AI가 OX, 4지선다 퀴즈 자동 생성
- 헷갈리는 개념 바로 AI한테 질문 가능
- 이해도 체크하면 시험 예상 점수 계산
- 틀린 문제 오답노트 자동 저장
- 시험 일정 등록하면 오늘 뭐 공부해야 하는지 AI가 플랜 짜줌
- 매일 퀴즈 풀면 스트릭 쌓임

---

## 기술 스택

```
Next.js 16 (App Router) + TypeScript
Tailwind CSS v4 + shadcn/ui
OpenAI GPT-4o-mini
Supabase (PostgreSQL + Auth)
Zustand (전역 상태)
TanStack Query (서버 상태 캐싱)
Stripe (결제)
Vercel (배포)
```

---

## 로컬 실행

```bash
npm install
```

`.env.local` 만들고:

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
STRIPE_SECRET_KEY=sk_...
STRIPE_PRO_PRICE_ID=price_...
ADMIN_PASSWORD=...
```

```bash
npm run dev
```

---

## DB 테이블 (Supabase)

```sql
create table analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users,
  file_name   text not null,
  one_liner   text,
  summary     text,
  flow        jsonb,
  concepts    jsonb,
  exam_points jsonb,
  created_at  timestamptz default now()
);

create table concept_understanding (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  analysis_id  text,
  concept_name text not null,
  course_name  text,
  file_name    text,
  status       text check (status in ('understood', 'confused')),
  created_at   timestamptz default now()
);

create table events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  event_name  text not null,
  metadata    jsonb,
  created_at  timestamptz default now()
);
```

---

## 페이지 구조

```
/                       랜딩
/dashboard              홈 (통계, 복습 배너, 일정)
/dashboard/upload       PDF/PPTX 업로드
/dashboard/analysis     분석 결과 (개요/개념/맵/타임라인/요약)
/dashboard/quiz         AI 퀴즈
/dashboard/wrong-notes  오답노트
/dashboard/knowledge    지식 그래프 + 시험 예측
/dashboard/planner      AI 학습 플랜
/dashboard/chat         AI 채팅
/dashboard/calendar     일정 캘린더
/dashboard/notes        학습 노트
/dashboard/exam         시험 준비
/dashboard/settings     설정
/admin                  관리자 (KPI, 퍼널)
```

---

## 만든 사람

홍대 컴공 3학년. 시험 전날 밤새다가 만들었습니다.
