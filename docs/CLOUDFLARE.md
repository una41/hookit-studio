# Cloudflare + Firebase Spark 연결

웹과 API: https://hookit-studio.yn8206.workers.dev

Firebase Auth/Firestore는 기존 hookit-studio 프로젝트를 사용한다. Cloud Functions와 Render는 사용하지 않는다. 유료 전환은 자동으로 하지 않는다. 무료 한도 내 CPU·요청 수·Firestore 사용량은 실계정 테스트에서 확인해야 한다.

## Cloudflare 설정

Worker Settings → Variables and Secrets:

| 종류 | 이름 | 값 |
| --- | --- | --- |
| Secret | META_APP_SECRET | 재발급한 Instagram 앱 시크릿 |
| Secret | META_WEBHOOK_VERIFY_TOKEN | Meta 웹훅에 저장한 검증 토큰 |
| Secret | FIREBASE_SERVICE_ACCOUNT | 기존 Firebase 서비스 계정 JSON 전체 |
| Secret | TOKEN_ENCRYPTION_KEY | 32바이트 난수의 Base64 값 |
| Variable | META_GRAPH_VERSION | Meta 앱의 Graph API 버전 (v숫자.0 형식) |

공개 프로젝트 설정과 앱 ID는 wrangler.jsonc에 있다. 비밀키를 VITE_ 변수나 Git에 넣지 않는다. 서비스 계정은 서버에서만 사용하며 Firestore 접근 권한이 필요하다.

기존 키를 Cloudflare Secret에 등록하려면:

```powershell
Get-Content -Raw -LiteralPath 'C:\Users\lyn62\keys\hookit.json' | npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))" | npx wrangler secret put TOKEN_ENCRYPTION_KEY
```

암호화 키 생성은 최초 한 번만 실행한다. 연결 후 키를 바꾸면 Instagram 재연결이 필요하다. 키 내용은 채팅에 보내지 않는다.

Meta Instagram 비즈니스 로그인 설정의 유효한 OAuth 리디렉션 URI:

```
https://hookit-studio.yn8206.workers.dev/api/instagram/callback
```

이미 검증한 웹훅 URL은 별개다:

```
https://hookit-studio.yn8206.workers.dev/webhooks/instagram
```

Firebase Auth 승인된 도메인에 hookit-studio.yn8206.workers.dev를 등록한다. Meta 앱 역할/권한과 프로페셔널 Instagram 계정의 실제 연결 가능 여부도 확인한다.

## 배포

```powershell
npm ci
npm test
npm run test:worker
npm run server:test
npm run deploy:cloudflare
```

GitHub 자동 배포에서도 npm run build:worker 및 npm run build를 먼저 실행해야 한다. worker/core의 api/oauth/instagram/security/schema/worker/webhook은 functions/src에서 생성한다. auth/db는 Worker 전용 구현이다.

1. Cloudflare 사이트에서 Firebase 계정으로 로그인한다.
2. 인스타그램 연결하기 → 공식 로그인에서 권한 허용.
3. 게시물 불러오기 → 선택 → 자동화 초안 저장.
4. 댓글·버튼·팔로우 여부·중복 발송을 실계정으로 검증한 뒤 서버의 workspaces/main/privateConfig/automation.enabled를 활성화한다. 현재 비활성 상태를 유지한다.

## 현재 한계

- 게시물은 최근 최대 50개. 추가 페이지 불러오기는 아직 없다.
- 액세스 토큰 자동 갱신은 아직 없다. 만료 시 재연결한다.
- Firestore REST API로 인증·트랜잭션·중복 방지를 처리한다. 웹훅 요청 안에서 이벤트를 처리하고 실패 시 503으로 Meta 재전송을 유도한다. 별도의 내구성 큐나 예약 재처리는 아직 없다.
- 처리 중 장애 또는 발송 결과 불명은 중복 방지를 위해 자동 재발송하지 않는다. 운영자가 이력을 확인해야 한다.
- 실계정 OAuth·게시물·DM과 무료 플랜 CPU/요청 한도는 운영 검증 전이다. 웹훅 검증 성공만으로 발송 준비 완료는 아니다.
- API 허용 출처는 Cloudflare 주소다. 기존 Firebase Hosting 주소 대신 위 주소로 접속한다.

## Firebase 로그인 빌드 설정

Firebase 공개 웹 설정은 src/lib/firebase.ts에 기본값으로 포함한다. GitHub 자동 빌드는 로컬 .env 파일 없이도 로그인 설정을 포함한다. 다른 Firebase 프로젝트로 변경할 때는 VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID를 모두 제공한다. 서비스 계정과 Meta 시크릿은 계속 Worker Secret에만 저장한다.
