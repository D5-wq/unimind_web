# UniMind 🧠

시험기간마다 슬라이드 100장 읽고, 뭐가 중요한지 모르고, 외웠다고 생각했는데 틀리는 걸 반복했어요.

"AI가 대신 분석해주면 안 되나?" 에서 시작했습니다.

**강의 PDF를 올리면 핵심 개념 정리, 퀴즈 생성, 취약 개념 분석, 시험 점수 예측까지 한 번에.**

🔗 **[unimind-web.vercel.app](https://unimind-web.vercel.app)**

---

## 왜 만들었나요?

시험기간마다

- 슬라이드 100장 읽기
- 뭐가 중요한지 모르기
- 외웠다고 생각했는데 틀리기

를 반복했습니다.

그래서 "AI가 대신 분석해주면 안 되나?" 에서 시작했습니다.

---

## 주요 기능

**PDF 분석**
강의 자료를 올리면 한 줄 요약, 핵심 개념, 강의 흐름, 시험 포인트 자동 생성

**AI 퀴즈**
OX, 4지선다 자동 생성. 틀린 문제는 오답노트에 자동 저장

**이해도 추적**
개념마다 이해/헷갈림 체크. 데이터 누적으로 취약점 파악

**시험 점수 예측**
퀴즈 결과 + 이해도 데이터 기반으로 예상 점수 제공

**AI 학습 플래너**
시험 일정 입력하면 오늘 공부할 내용 자동 추천

**지식 그래프**
여러 강의 개념이 어떻게 연결되는지 시각화

---

## 기술 스택

```
Next.js 16 (App Router) + TypeScript
Tailwind CSS v4 + shadcn/ui
OpenAI GPT-4o-mini
Supabase (PostgreSQL + Auth)
Zustand · TanStack Query
Stripe
Vercel
```

---

## 개발 방식

Claude Code(AI 페어 프로그래밍)를 적극 활용해 개발했습니다.
아키텍처 설계, 기술 선택, 코드 리뷰 등 핵심 의사결정은 직접 수행했습니다.

---

## 로컬 실행

```bash
npm install
```

`.env.local`:

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

## DB (Supabase)

```sql
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  file_name text not null,
  one_liner text, summary text,
  flow jsonb, concepts jsonb, exam_points jsonb,
  created_at timestamptz default now()
);

create table concept_understanding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, analysis_id text,
  concept_name text not null, course_name text,
  status text check (status in ('understood', 'confused')),
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, event_name text not null,
  metadata jsonb, created_at timestamptz default now()
);
```

---

홍대 컴공 3학년. 시험기간에 만들었습니다.
