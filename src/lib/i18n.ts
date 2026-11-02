// Customer-facing copy. English is the base; other languages override keys.
// Japanese and Chinese strings need review by native speakers before launch.
import type { Locale } from "./types";

const en = {
  langName: "English",
  cat_beauty: "K-Beauty", cat_kpop: "K-Pop", cat_fashion: "K-Fashion",
  nav_home: "Home", nav_ranking: "Ranking", nav_skin: "Skin Match", nav_orders: "Orders",
  cutoff: "Order by {time} for delivery to your hotel tonight",
  skinBannerKicker: "AI SKIN MATCH", skinBannerTitle: "Find your K-skincare routine", skinBannerSub: "5 questions · 1 minute",
  trending: "Trending with travelers", seeAll: "See all",
  region_all: "All", region_japan: "Japan", region_greater_china: "China·Taiwan", region_sea: "SE Asia", region_americas: "Americas",
  best: "{cat} Best", rankingNote: "Our sales + Korean store charts", sameDay: "Same-day",
  reviews: "{n} reviews", samePrice: "Same price as Korean stores",
  addToCart: "Add to cart", added: "Added", delivery: "Delivery", tonight: "Tonight to your hotel",
  cart: "Cart", emptyCart: "Your cart is empty.", shopNow: "Shop bestsellers",
  itemsTotal: "Items (store price)", serviceFee: "Service fee", deliveryFee: "Hotel delivery", free: "Free", total: "Total",
  deliverToHotel: "Deliver to my hotel",
  hotelDelivery: "Hotel delivery", hotel: "Hotel", hotelSearch: "Search your hotel", guestName: "Name on reservation", room: "Room (optional)",
  email: "Email for order updates", deliveryTime: "Delivery time", payWith: "Pay with", pay: "Pay {amount}",
  pm_card: "Card", pm_alipay: "Alipay", pm_wechatpay: "WeChat Pay", pm_paypay: "PayPay", pm_linepay: "LINE Pay", pm_grabpay: "GrabPay",
  order: "Order {id}", arriving: "Arriving", frontDesk: "Front desk · {hotel} · under \"{name}\"",
  st_paid: "Order confirmed", st_paid_d: "Receipt sent to your email",
  st_purchased: "Items purchased", st_purchased_d: "Picked up from Korean stores",
  st_delivering: "On the way", st_delivering_d: "Courier heading to your hotel",
  st_delivered: "At the front desk", st_delivered_d: "Say your name to collect",
  handoverPhoto: "Front desk handover photo appears here", keepShopping: "Keep shopping",
  lookupTitle: "Find my order", lookupDesc: "Enter the email and order number from your receipt.", orderNumber: "Order number", find: "Find order",
  skipIntro: "Skip", next: "Next", start: "Start shopping",
  intro1_k: "Korea's best, in one place", intro1_t: "Top K-Beauty & K-Pop picks,\nall in one app", intro1_b: "See what travelers in Seoul are buying right now, ranked by category. Same prices as Korean stores.",
  intro2_k: "AI Skin Match", intro2_t: "5 questions to your\nperfect routine", intro2_b: "Tell us your skin type and concerns, and AI picks a K-skincare routine from toner to sunscreen.",
  intro3_k: "Same-day hotel delivery", intro3_t: "Pick it up tonight\nat your front desk", intro3_b: "Order before 3 PM and we deliver to your hotel the same day. No more store hopping.",
  photoSlot: "Seoul photo: {what}",
  comingSoon: "Coming in step {n}",
};
export type Messages = typeof en;

const ko: Messages = {
  langName: "한국어",
  cat_beauty: "K-뷰티", cat_kpop: "K-팝", cat_fashion: "K-패션",
  nav_home: "홈", nav_ranking: "랭킹", nav_skin: "피부 진단", nav_orders: "주문",
  cutoff: "{time}까지 주문하면 오늘 밤 호텔로 배달",
  skinBannerKicker: "AI 피부 진단", skinBannerTitle: "나에게 맞는 K-스킨케어 찾기", skinBannerSub: "질문 5개 · 1분",
  trending: "여행객 인기 랭킹", seeAll: "전체 보기",
  region_all: "전체", region_japan: "일본", region_greater_china: "중화권", region_sea: "동남아", region_americas: "미주",
  best: "{cat} 베스트", rankingNote: "하이서울 판매량 + 국내 매장 랭킹 반영", sameDay: "당일 배달",
  reviews: "리뷰 {n}개", samePrice: "국내 매장과 같은 가격",
  addToCart: "장바구니 담기", added: "담았어요", delivery: "배달", tonight: "오늘 밤 호텔로",
  cart: "장바구니", emptyCart: "장바구니가 비어 있어요.", shopNow: "베스트 보러 가기",
  itemsTotal: "상품 금액 (매장가)", serviceFee: "서비스 수수료", deliveryFee: "호텔 배달비", free: "무료", total: "결제 금액",
  deliverToHotel: "호텔로 배달받기",
  hotelDelivery: "호텔 배달 정보", hotel: "호텔", hotelSearch: "호텔 검색", guestName: "예약자 이름", room: "객실 (선택)",
  email: "주문 알림 받을 이메일", deliveryTime: "배달 시간", payWith: "결제 수단", pay: "{amount} 결제하기",
  pm_card: "해외카드", pm_alipay: "알리페이", pm_wechatpay: "위챗페이", pm_paypay: "페이페이", pm_linepay: "라인페이", pm_grabpay: "그랩페이",
  order: "주문 {id}", arriving: "도착 예정", frontDesk: "{hotel} 프런트 · 예약자 \"{name}\"",
  st_paid: "주문 확인", st_paid_d: "영수증을 이메일로 보냈어요",
  st_purchased: "상품 구매 완료", st_purchased_d: "국내 매장에서 픽업했어요",
  st_delivering: "배달 중", st_delivering_d: "기사님이 호텔로 가고 있어요",
  st_delivered: "프런트 도착", st_delivered_d: "예약자 이름을 말하고 받아 가세요",
  handoverPhoto: "프런트 전달 사진이 여기에 표시돼요", keepShopping: "쇼핑 계속하기",
  lookupTitle: "주문 조회", lookupDesc: "영수증의 이메일과 주문번호를 입력하세요.", orderNumber: "주문번호", find: "조회하기",
  skipIntro: "건너뛰기", next: "다음", start: "쇼핑 시작하기",
  intro1_k: "서울의 K-베스트", intro1_t: "K-뷰티, K-팝 인기템을\n한 곳에서", intro1_b: "지금 서울 여행객들이 가장 많이 사는 상품을 분야별 랭킹으로 보여 드려요. 매장과 같은 가격이에요.",
  intro2_k: "AI 피부 진단", intro2_t: "질문 5개로 찾는\n나만의 루틴", intro2_b: "피부 타입과 고민을 알려 주면 AI가 토너부터 선크림까지 맞는 K-스킨케어를 골라 드려요.",
  intro3_k: "당일 호텔 배달", intro3_t: "오늘 밤,\n호텔 프런트에서 받으세요", intro3_b: "오후 3시 전에 주문하면 묵고 있는 호텔로 당일 배달해요. 매장을 돌아다니지 않아도 돼요.",
  photoSlot: "서울 실사 사진: {what}",
  comingSoon: "{n}단계에서 완성 예정",
};

const ja: Partial<Messages> = {
  langName: "日本語",
  cat_beauty: "Kビューティー", cat_kpop: "Kポップ", cat_fashion: "Kファッション",
  nav_home: "ホーム", nav_ranking: "ランキング", nav_skin: "肌診断", nav_orders: "注文",
  cutoff: "{time}までのご注文で今夜ホテルにお届け",
  trending: "旅行者に人気", seeAll: "すべて見る",
  addToCart: "カートに入れる", cart: "カート", deliverToHotel: "ホテルに届ける", total: "合計",
  samePrice: "韓国の店舗と同じ価格", skipIntro: "スキップ", next: "次へ", start: "ショッピングを始める",
};

const zhCN: Partial<Messages> = {
  langName: "简体中文",
  cat_beauty: "K美妆", cat_kpop: "K-POP", cat_fashion: "K时尚",
  nav_home: "首页", nav_ranking: "排行", nav_skin: "肤质测试", nav_orders: "订单",
  cutoff: "{time}前下单，今晚送到酒店",
  trending: "游客热门榜", seeAll: "查看全部",
  addToCart: "加入购物车", cart: "购物车", deliverToHotel: "送到我的酒店", total: "合计",
  samePrice: "与韩国门店同价", skipIntro: "跳过", next: "下一步", start: "开始购物",
};

const zhTW: Partial<Messages> = {
  langName: "繁體中文",
  cat_beauty: "K美妝", cat_kpop: "K-POP", cat_fashion: "K時尚",
  nav_home: "首頁", nav_ranking: "排行", nav_skin: "膚質測驗", nav_orders: "訂單",
  cutoff: "{time}前下單，今晚送到飯店",
  trending: "旅客熱門榜", seeAll: "查看全部",
  addToCart: "加入購物車", cart: "購物車", deliverToHotel: "送到我的飯店", total: "合計",
  samePrice: "與韓國門市同價", skipIntro: "略過", next: "下一步", start: "開始購物",
};

const dicts: Record<Locale, Partial<Messages>> = { en, ko, ja, "zh-CN": zhCN, "zh-TW": zhTW };

export function messages(locale: Locale): Messages {
  return { ...en, ...dicts[locale] } as Messages;
}

/** Replace {name} placeholders. */
export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function detectLocale(navLang: string | undefined): Locale {
  const l = (navLang ?? "en").toLowerCase();
  if (l.startsWith("ko")) return "ko";
  if (l.startsWith("ja")) return "ja";
  if (l === "zh-tw" || l === "zh-hk" || l.startsWith("zh-hant")) return "zh-TW";
  if (l.startsWith("zh")) return "zh-CN";
  return "en";
}
