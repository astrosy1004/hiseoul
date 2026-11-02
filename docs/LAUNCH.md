# 출시 점검표 (HiSeoul)

## 1. 배포 (Vercel)

1. Vercel 프로젝트 `hiseoul`을 GitHub 저장소 `astrosy1004/hiseoul`과 연결해요. 브랜치에 올릴 때마다 미리보기 주소가 생기고, `main`에 합치면 실제 서비스 주소에 반영돼요.
2. Vercel > Project > Settings > Environment Variables에 아래 값을 넣어요 (Production, Preview 모두).

| 이름 | 어디서 | 공개 여부 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API Keys | 공개 가능 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 같은 곳, Publishable key | 공개 가능 |
| `NEXT_PUBLIC_SITE_URL` | 서비스 주소 (예: `https://hiseoul.vercel.app`) | 공개 가능 |
| `SUPABASE_SECRET_KEY` | 같은 곳, Secret key | **비밀 (Sensitive로 저장)** |
| `ANTHROPIC_API_KEY` | platform.claude.com > API keys | **비밀** |
| `RESEND_API_KEY`, `EMAIL_FROM` | resend.com | **비밀** |

3. Supabase > Authentication > URL Configuration에 서비스 주소를 Site URL로, `https://서비스주소/**`를 Redirect URLs에 추가해요.
4. 값을 바꾼 뒤에는 Vercel에서 Redeploy를 눌러야 반영돼요.

DB 설정 없이 배포되면 예시 데이터로 보이고, 관리자 로그인은 막혀 있어요.

## 2. 출시 전에 꼭 정할 것

- [ ] 결제사(PG) 계약 → `src/lib/payments.ts` 연결 → 관리자 > 운영 설정에서 시험 결제 끄기
- [ ] 수수료·배달비 확정 (관리자 > 운영 설정)
- [ ] 배송 기사(퀵) 견적, 호텔 프런트 보관 협조
- [ ] 개인정보 처리방침(`/privacy`) 법률 검토, 문의 이메일 주소 바꾸기
- [ ] 통신판매업 신고, 사업자 정보 표시
- [ ] 일본어·중국어 문구 원어민 검토
- [ ] 메일 보내는 도메인 인증 (Resend), 시험 주문으로 메일 3종 확인
- [ ] 상품 사진은 직접 찍은 것만 사용

## 3. 출시 당일 확인

- [ ] 대표 계정으로 관리자 로그인 (인증 앱 코드까지)
- [ ] 직원 1명 초대 → 메일 링크로 비밀번호 만들기 → 로그인
- [ ] 상품 1개 사진으로 등록 (AI 작성 확인) → 앱 노출
- [ ] 손님 화면에서 주문 → 결제 → 확인 메일
- [ ] 관리자에서 구매 완료 → 배달 출발 (출발 메일) → 사진 찍고 전달 완료 (도착 메일, 사진)
- [ ] 손님 주문 화면에 단계별 시각과 사진이 보이는지
