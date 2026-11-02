# HiSeoul (하이서울)

K-팝·K-뷰티에 관심 있는 외국인 여행객을 위한 쇼핑 웹앱입니다. 분야별 베스트 아이템을 사면 **묵고 있는 호텔 프런트로 당일 배달**해 줍니다.

> 현재는 데모 버전입니다. 상품, 가격, 호텔, 환율은 모두 예시 데이터이고 결제와 배송은 실제로 일어나지 않습니다.

## 개발 단계

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 기반 정리: 핑크·Pretendard 디자인, 5개 언어, 고객·관리자 화면 뼈대, 데이터 구조 | 완료 |
| 2 | DB·로그인 연결 (Supabase, 관리자 2단계 로그인) | 완료 |
| 3 | 상품·랭킹 화면 (지역별 랭킹, 피부 타입 필터, 상세, 검색, 5개 언어) | 완료 |
| 4 | AI 피부 진단 (질문 5개 → 루틴 추천, Claude 설명, 공유 이미지) | 완료 |
| 5 | 장바구니·호텔 배달 주문·결제 (시험 결제, PG 연결부 준비) | 완료 |
| 6 | 관리자 (주문, 상품 + AI 설명, 직원 계정) | 예정 |
| 7 | 배달 추적·알림 | 예정 |
| 8 | 테스트·배포 | 예정 |

## 화면 주소

- 고객: `/welcome`(첫 방문 안내), `/`, `/category/beauty`, `/product/b1`, `/cart`, `/checkout`, `/orders/lookup`, `/orders/HS-1042`, `/skin-match`, `/search`
- 관리자: `/admin/login` → `/admin`, `/admin/products`, `/admin/accounts`
- DB 미연결일 때 개발용 관리자 로그인: `owner@hiseoul.kr` + 아무 비밀번호 + 아무 6자리 숫자
- 주문 조회 예시: `yuki@example.com` / `HS-1042`

## 기술 스택

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- 상태: React Context + localStorage (장바구니, 언어, 통화)
- 데이터: Supabase (Postgres + 로그인 + 2단계 인증). `src/lib/repo.ts`를 통해서만 접근하고, `.env.local`이 없으면 예시 데이터로 동작

## 실행 방법

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 확인
```

## Supabase 연결 (처음 한 번)

1. Supabase 대시보드 > **SQL Editor**에 `supabase/setup.sql` 내용을 붙여 넣고 Run (테이블, 보안 규칙, 예시 데이터 생성)
2. **Authentication > Users > Add user**로 대표 계정(이메일·비밀번호, Auto Confirm 체크)을 만들기
3. `supabase/owner.sql`의 이메일을 2번 이메일로 바꿔 SQL Editor에서 Run
4. `.env.local.example`을 `.env.local`로 복사하고 **Project Settings > API Keys**의 Project URL과 Publishable key를 넣기
5. (선택) AI 피부 진단 설명을 켜려면 `.env.local`에 `ANTHROPIC_API_KEY=`를 추가 (platform.claude.com에서 발급, 서버에서만 사용). 없으면 기본 문구로 동작
6. `npm install` → `npm run dev` 후 `/admin/login`에서 로그인 → 처음에는 QR을 인증 앱(Google Authenticator 등)으로 찍고 6자리 입력

결제: 지금은 **시험 결제**예요(실제 돈이 나가지 않음). PG가 정해지면 `src/lib/payments.ts`만 바꾸고, Supabase `app_settings.test_payments`를 false로 바꿔 시험 결제를 막아요. 서비스 수수료·배달비·마감 시각도 `app_settings` 표에서 바꿀 수 있어요.

보안 규칙 요약: 손님은 노출 상품·랭킹·호텔만 읽고, 주문은 주문번호+이메일로만 조회해요. 주문·직원 데이터는 인증 앱 확인까지 마친 직원만 볼 수 있고, 직원은 주문 상태만 바꿀 수 있어요(금액은 못 바꿈). 직원 계정은 대표만 관리해요.

예시 데이터를 바꾸면 `node --experimental-strip-types scripts/make-seed.mjs`로 SQL을 다시 만들어요.

## 폴더 구조

```
src/
  app/(shop)/       고객 화면 (휴대폰 폭)
  app/welcome/      첫 방문 안내 화면
  app/admin/        관리자 화면 (PC)
  components/       공통·고객·관리자 컴포넌트
  lib/types.ts      데이터 구조 (DB 테이블 설계와 같음)
  lib/repo.ts       데이터 접근 (Supabase 또는 예시 데이터)
  lib/supabase.ts   Supabase 연결
  lib/admin-session.ts  관리자 로그인 (비밀번호 + 인증 앱)
supabase/           DB 설계(schema.sql), 예시 데이터(seed.sql), 한 번에 실행(setup.sql), 대표 등록(owner.sql)
  lib/mock-data.ts  예시 상품·랭킹·호텔·주문·직원
  lib/i18n.ts       영어·일본어·중국어(간체/번체)·한국어 문구
  lib/skin-match.ts 피부 진단 질문·추천 규칙 (AI는 설명만 작성)
  app/api/skin-match/  Claude로 추천 이유·팁 작성 (서버)
  lib/delivery.ts   배달 날짜·시간대 규칙 (한국 시간)
  lib/payments.ts   결제 연결부 (시험 결제 → PG 교체 지점)
  lib/config.ts     당일 마감, 수수료(미정), 환율
```
