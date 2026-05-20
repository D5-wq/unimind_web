# UniMind — AI 강의 학습 어시스턴트

> 강의 자료(PDF/PPTX)를 업로드하면 AI가 핵심 개념을 정리하고 시험을 대비해주는 대학생 맞춤 학습 도우미

**🔗 라이브 데모: [unimind-web.vercel.app](https://unimind-web.vercel.app)**

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **AI 강의 분석** | PDF/PPTX 업로드 → GPT-4o-mini가 핵심 개념, 강의 흐름, 시험 포인트 자동 추출 |
| **분석 결과 5탭** | 개요 / 핵심 개념 / 개념 맵 / 타임라인 / 요약 |
| **AI 채팅** | 강의 컨텍스트 기반으로 질문하면 맥락을 이해하고 답변 |
| **학습 플래너** | D-Day 시험 카운트다운, 주간 학습 목표 체크리스트 |
| **학습 노트** | 태그 기반 노트 에디터, 강의별 정리 |
| **일정 캘린더** | 월별 캘린더에 시험/과제 일정 등록 및 관리 |
| **개념 맵** | 강의 핵심 개념을 SVG 노드 그래프로 시각화 |
| **알림 시스템** | 분석 완료 시 헤더 알림, 클릭 시 결과 페이지 이동 |

---

## 기술 스택

**Frontend**
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- shadcn/ui + Radix UI
- Lucide React

**Backend / AI**
- OpenAI GPT-4o-mini — 강의 분석
- `unpdf` — PDF 텍스트 추출
- `jszip` — PPTX 파싱 (slide XML)

**Database**
- Supabase (PostgreSQL) — 분석 결과 클라우드 저장

---

## 아키텍처 흐름

```
사용자 PDF 업로드
    ↓
/api/analyze (Next.js Route Handler)
    ├── unpdf / jszip → 텍스트 추출
    ├── OpenAI GPT-4o-mini → JSON 분석 결과
    └── Supabase → analyses 테이블 저장
    ↓
분석 결과 반환 (oneLiner, flow, concepts, examPoints, supabaseId)
    ↓
클라이언트: localStorage 캐시 + Supabase UUID 기반 라우팅
```

---

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력하세요:

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 실행:

```sql
create table analyses (
  id          uuid primary key default gen_random_uuid(),
  file_name   text not null,
  one_liner   text,
  flow        jsonb,
  concepts    jsonb,
  exam_points jsonb,
  created_at  timestamptz default now()
);

alter table analyses disable row level security;
```

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 접속

---

## 페이지 구조

```
/                       온보딩 랜딩 페이지
/dashboard              홈 대시보드 (통계, 일정, AI 추천)
/dashboard/courses      강의 목록 관리
/dashboard/upload       PDF/PPTX 업로드 및 AI 분석
/dashboard/analysis     분석 결과 (5탭)
/dashboard/chat         AI 채팅 Q&A
/dashboard/exam         시험 준비 (체크리스트, 예상 포인트)
/dashboard/planner      학습 플래너 (D-Day, 주간 목표)
/dashboard/notes        학습 노트 에디터
/dashboard/calendar     월별 일정 캘린더
/dashboard/concept-map  개념 맵 시각화
/dashboard/settings     프로필 및 설정
```

---

## 향후 계획

- [ ] Supabase Auth 로그인 / 회원가입
- [ ] 로그인 기반 데이터 완전 클라우드화 (강의, 노트, 플래너)
- [ ] Vercel 배포
- [ ] 강의별 분석 히스토리 관리
- [ ] 모바일 반응형 최적화

---

## 개발 환경

- Node.js 18+
- Next.js 16.2.6
- TypeScript 5.7.3
