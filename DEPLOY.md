# 🚀 Pedia.Page 배포 가이드

사용자들의 **API 키 설정 번거로움 없이** 바로 사용할 수 있는 3가지 배포 옵션을 제공합니다.

## 📋 배포 옵션 비교

| 옵션 | 사용자 경험 | 운영 비용 | 설정 난이도 |
|------|------------|----------|------------|
| 🆓 **무료 체험** | 일일 10회 무료 | 개발자 부담 | ⭐ 쉬움 |
| 💰 **프리미엄** | 무제한 사용 | 구독료로 충당 | ⭐⭐ 보통 |
| 🔧 **개인 API** | 완전 무제한 | 사용자 부담 | ⭐⭐⭐ 어려움 |

---

## 🆓 옵션 1: 무료 체험판 (추천)

사용자들이 **API 키 없이** 바로 체험할 수 있는 버전입니다.

### ✨ 특징
- 하루 10회까지 무료 사용 가능
- 모든 언어 지원
- API 키 설정 불필요
- 실시간 사용량 표시

### 🚀 원클릭 배포
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/hyukjean/pedia.page)

### 🔧 수동 설정

1. **GitHub에서 Fork**
2. **Netlify 연결**
3. **환경 변수 설정**
   ```bash
   DEMO_GEMINI_API_KEY=your-demo-api-key-here
   ```
4. **배포**

### 📊 사용량 모니터링
```javascript
// 사용량 확인 (admin용)
console.log('Daily usage stats:', usageTracker);
```

---

## 💰 옵션 2: 프리미엄 서비스

구독 기반으로 무제한 사용을 제공하는 수익형 모델입니다.

### ✨ 특징
- **무료**: 일일 5회, 5장 카드, 기본 모델
- **프리미엄**: 무제한 사용, 20장 카드, 고급 모델

### 🔧 설정 방법

1. **결제 시스템 연동**
   ```bash
   # Stripe 설치
   npm install stripe
   ```

2. **환경 변수 추가**
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   DEMO_GEMINI_API_KEY=your-api-key
   ```

3. **API 교체**
   ```bash
   mv netlify/functions/gemini.js netlify/functions/gemini-basic.js
   mv netlify/functions/gemini-premium.js netlify/functions/gemini.js
   ```

### 💳 요금 구조 예시
- 무료: 일일 5회 제한
- 프리미엄: 월 $9.99 무제한

---

## 🔧 옵션 3: 개인 API 키

사용자가 직접 API 키를 설정하는 전통적인 방식입니다.

### ✨ 특징
- 완전 무제한 사용
- Gemini API 무료 할당량 활용 (월 1M 토큰)
- 사용자가 직접 비용 관리

### 🔧 설정 방법

1. **무제한 버전으로 교체**
   ```bash
   mv netlify/functions/gemini.js netlify/functions/gemini-limited.js
   mv netlify/functions/gemini-unlimited.js netlify/functions/gemini.js
   ```

2. **환경 변수만 설정**
   ```bash
   GEMINI_API_KEY=your-personal-api-key
   ```

### 📝 사용자 안내
```markdown
### 🔑 API 키 설정 방법

1. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 무료 API 키 발급
2. Netlify Dashboard → Site Settings → Environment variables
3. `GEMINI_API_KEY` 추가
4. 사이트 재배포

**무료 할당량**: 월 1백만 토큰 (약 1000회 사용)
```

---

## 🎯 권장 전략

### 🚀 서비스 런칭 단계
```
1. 무료 체험판으로 시작 (사용자 확보)
   ↓
2. 사용량 증가 시 프리미엄 모델 도입
   ↓
3. 기업용 API 키 옵션 추가 제공
```

### 📈 수익화 로드맵
- **1단계**: 무료 체험으로 유저 확보
- **2단계**: 프리미엄 구독제 도입
- **3단계**: 기업용 무제한 플랜

### 🔍 모니터링 지표
- 일일 활성 사용자 (DAU)
- API 호출 횟수
- 프리미엄 전환율
- 사용량 패턴 분석

---

## 🛠️ 기술적 구현

### 사용량 추적 시스템
```javascript
// netlify/functions/gemini.js
const usageTracker = new Map();
const DAILY_FREE_LIMIT = 10;

function checkUsageLimit(clientId) {
  const today = new Date().toDateString();
  const key = `${clientId}-${today}`;
  const usage = usageTracker.get(key) || 0;
  return { allowed: usage < DAILY_FREE_LIMIT, remaining: DAILY_FREE_LIMIT - usage };
}
```

### 클라이언트 알림 시스템
```javascript
// src/api.ts
function showUsageNotification(message, type) {
  // 실시간 사용량 표시
}
```

---

## 🔒 보안 고려사항

1. **IP 기반 제한**: 간단하지만 우회 가능
2. **JWT 토큰**: 더 안전하지만 복잡함
3. **Rate Limiting**: DDoS 방지
4. **API 키 보호**: 환경 변수 사용 필수

---

## 🔑 Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 방문
2. "Create API key" 클릭
3. API 키 복사 및 환경 변수에 설정

**참고:** Gemini API는 무료 할당량이 매월 제공됩니다:
- 15 requests/minute
- 1M tokens/minute  
- 1,500 requests/day

---

## 📞 지원 및 문의

- 🐛 버그 리포트: GitHub Issues
- 💡 기능 요청: GitHub Discussions  
- 📧 비즈니스 문의: 이메일

**개발자를 위한 팁**: 
- 무료 체험판으로 시작해서 사용자 반응을 확인한 후 수익화 모델을 결정하세요!
- Gemini API는 매월 무료 할당량이 충분하므로 초기에는 비용 걱정 없이 서비스할 수 있습니다.
