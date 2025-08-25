# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### 단계 1: Google Cloud Project 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 단계 2: OAuth 동의 화면 설정
1. 좌측 메뉴에서 "APIs & Services" > "OAuth consent screen" 선택
2. User Type: "External" 선택 (개인 사용자의 경우)
3. 앱 정보 입력:
   - App name: `Pedia.page`
   - User support email: 본인 이메일
   - Developer contact information: 본인 이메일

### 단계 3: OAuth 2.0 클라이언트 ID 생성
1. 좌측 메뉴에서 "APIs & Services" > "Credentials" 선택
2. "+ CREATE CREDENTIALS" > "OAuth client ID" 클릭
3. Application type: "Web application" 선택
4. Name: `Pedia.page Web Client`

### 단계 4: 승인된 도메인 설정

**승인된 JavaScript 원본 (Authorized JavaScript origins):**
```
https://pedia.page
http://localhost:5174
```

**승인된 리디렉션 URI (Authorized redirect URIs):**
현재 구현에서는 필요하지 않음 (JavaScript API 사용)

## 2. 환경 변수 설정

### 로컬 개발환경
`.env` 파일 생성:
```bash
VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
```

### Netlify 프로덕션 환경
1. Netlify Dashboard > Site Settings > Environment Variables
2. 새 변수 추가:
   - Key: `VITE_GOOGLE_CLIENT_ID`
   - Value: `your_actual_client_id.apps.googleusercontent.com`

## 3. 테스트

### 로컬에서 테스트
```bash
npm run dev
```

### 프로덕션 배포
```bash
git add .
git commit -m "Configure Google OAuth"
git push
```

## 4. 주의사항

- 클라이언트 ID는 공개적으로 노출되어도 안전합니다 (브라우저에서 실행되는 JavaScript 코드)
- 실제 API 키는 서버 환경 변수로 관리되며 클라이언트에 노출되지 않습니다
- OAuth 설정이 완료되기 전까지는 로그인 버튼을 클릭해도 작동하지 않습니다

## 5. 문제 해결

### 일반적인 오류
- `Error 400: redirect_uri_mismatch`: 승인된 리디렉션 URI 설정 확인
- `Error 403: access_blocked`: OAuth 동의 화면 설정 확인
- 로그인 창이 뜨지 않음: 클라이언트 ID 설정 확인

### 개발자 도구에서 확인
브라우저 콘솔에서 다음과 같은 메시지 확인:
```
⚠️ Google OAuth not configured. Set VITE_GOOGLE_CLIENT_ID environment variable.
```
