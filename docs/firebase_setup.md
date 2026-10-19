# Firebase 설정 순서

문의 폼 저장, 텔레그램 알림, 관리자 페이지(`/admin`)를 쓰기 위한 설정입니다.
코드는 모두 준비되어 있고, 아래는 직접 해야 하는 설정입니다.

## 1. 프로젝트와 DB 만들기 (Firebase 콘솔)
1. 프로젝트 만들기 (Google 애널리틱스는 꺼도 됩니다)
2. **Firestore Database** → 데이터베이스 만들기 → **프로덕션 모드**, 위치는 `asia-northeast3 (서울)`

## 2. 사이트와 연결
1. 프로젝트 설정 → 내 앱 → **웹 앱 추가** (`</>`)
2. 나오는 설정값(`apiKey`, `authDomain`, `projectId`, `appId`)을 프로젝트 루트의 `.env.local` 파일에 넣기
   (`.env.example`을 복사해서 이름을 `.env.local`로 바꾸고 채우기)
3. 개발 서버를 껐다가 다시 켜기 (`npm run dev`)

## 3. 관리자 계정 만들기
1. **Authentication** → 시작하기 → 로그인 방법 → **이메일/비밀번호** 사용 설정
2. 사용자 탭 → 사용자 추가
   - 이메일: `admin@hookitstudio.kr` (아이디로는 `admin`만 입력하면 됩니다)
   - 비밀번호: 원하는 값 (길고 추측하기 어렵게)
3. 다른 아이디를 쓰려면 `src/constants/siteContent.ts`의 `ADMIN_LOGIN_EMAIL`과 `firestore.rules`의 이메일을 함께 바꾸세요.

## 4. 보안 규칙 올리기
```bash
npm i -g firebase-tools
firebase login
firebase use --add        # 만든 프로젝트 선택
firebase deploy --only firestore:rules
```
규칙 내용: 방문자는 문의를 **작성만** 할 수 있고(형식 검증), 읽기와 수정은 관리자 계정만 가능, 삭제는 불가.

## 5. 텔레그램 알림
1. 텔레그램에서 `@BotFather` → `/newbot` → 봇 이름 정하기 → **토큰** 받기
2. 만든 봇에게 아무 메시지나 한 번 보내기
3. 브라우저에서 `https://api.telegram.org/bot<토큰>/getUpdates` 열기 → `"chat":{"id":숫자}`의 **숫자**가 채팅 번호
4. Firebase 요금제를 **Blaze(종량제)** 로 변경 (서버 함수에 필요, 카드 등록 필요, 문의 알림 수준의 사용량은 무료 한도 안입니다. 예산 알림을 걸어 두세요.)
5. 비밀값 저장과 배포
```bash
npm --prefix functions install
firebase functions:secrets:set TELEGRAM_BOT_TOKEN     # 토큰 붙여넣기
firebase functions:secrets:set TELEGRAM_CHAT_ID       # 채팅 번호 붙여넣기
firebase deploy --only functions
```

## 6. 배포할 때 주의
- `/admin` 주소로 직접 들어와도 열리도록 호스팅에서 모든 경로를 `index.html`로 보내는 설정이 필요합니다.
  - Vercel: `vercel.json`에 `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
  - Netlify: `public/_redirects`에 `/* /index.html 200`
- 텔레그램 봇 토큰은 코드에 넣지 마세요. 위 5번 방법(서버 비밀값)으로만 보관합니다.

## 동작 확인
1. 사이트에서 문의 폼 제출 → "상담 신청이 접수됐어요" 화면
2. 텔레그램에 알림이 옴
3. `http://localhost:5173/admin` (배포 후에는 `도메인/admin`)에서 로그인 → 목록 확인
