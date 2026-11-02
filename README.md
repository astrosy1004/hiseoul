# HiSeoul (하이서울)

K-팝·K-뷰티에 관심 있는 외국인 여행객을 위한 쇼핑 웹앱입니다. 분야별 베스트 아이템을 사면 **묵고 있는 호텔 프런트로 당일 배달**해 줍니다.

> 현재는 데모 버전입니다. 상품, 가격, 호텔, 환율은 모두 예시 데이터이고 결제와 배송은 실제로 일어나지 않습니다.

## 개발 단계

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 기반 정리: 핑크·Pretendard 디자인, 5개 언어, 고객·관리자 화면 뼈대, 데이터 구조 | 완료 |
| 2 | DB·로그인 연결 (Supabase, 관리자 2단계 로그인) | 예정 |
| 3 | 상품·랭킹 화면 | 예정 |
| 4 | AI 피부 진단 | 예정 |
| 5 | 장바구니·호텔 배달 주문·결제 | 예정 |
| 6 | 관리자 (주문, 상품 + AI 설명, 직원 계정) | 예정 |
| 7 | 배달 추적·알림 | 예정 |
| 8 | 테스트·배포 | 예정 |

## 화면 주소

- 고객: `/welcome`(첫 방문 안내), `/`, `/category/beauty`, `/product/b1`, `/cart`, `/checkout`, `/orders/lookup`, `/orders/HS-1042`, `/skin-match`
- 관리자: `/admin/login` → `/admin`, `/admin/products`, `/admin/accounts`
- 개발용 관리자 로그인: `owner@hiseoul.kr` + 아무 비밀번호 + 아무 6자리 숫자 (2단계에서 실제 인증으로 교체)
- 주문 조회 예시: `yuki@example.com` / `HS-1042`

## 기술 스택

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- 상태: React Context + localStorage (장바구니, 언어, 통화)
- 데이터: `src/lib/repo.ts`를 통해서만 접근 (2단계에서 Supabase로 교체)

## 실행 방법

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 확인
```

## 폴더 구조

```
src/
  app/(shop)/       고객 화면 (휴대폰 폭)
  app/welcome/      첫 방문 안내 화면
  app/admin/        관리자 화면 (PC)
  components/       공통·고객·관리자 컴포넌트
  lib/types.ts      데이터 구조 (DB 테이블 설계와 같음)
  lib/repo.ts       데이터 접근 (지금은 예시 데이터)
  lib/mock-data.ts  예시 상품·랭킹·호텔·주문·직원
  lib/i18n.ts       영어·일본어·중국어(간체/번체)·한국어 문구
  lib/config.ts     당일 마감, 수수료(미정), 환율
```

## 다음 단계 제안

1. **실제 상품 연동**: 제휴 매장/도매 공급처 상품 API, 재고
2. **결제**: Stripe 또는 해외카드 PG, Alipay/WeChat Pay, 즉시 택스리펀 사업자 연동
3. **배송**: 퀵/배달 대행 API로 실시간 위치 추적, 호텔 프런트 수령 확인 사진
4. **백엔드·DB**: 회원, 주문, 관리자 페이지 (예: Supabase/Postgres)
5. **획기적 기능 확장**
   - 사진 기반 AI 피부 분석, 셀카로 립 컬러 가상 착용
   - 아이돌 컴백·콘서트 일정 연동 한정판 예약 구매
   - 체크아웃 전날 "출국 전 마지막 쇼핑" 알림, 공항 배송 옵션
   - 같은 호텔 투숙객 공동구매로 배달비 절감
