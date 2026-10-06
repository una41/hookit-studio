# HOOKIT STUDIO 개발 및 연결 안내

## 로컬에서 실행

프런트엔드는 Node.js 20.19 이상, 서버 배포 대상은 Node.js 22다. 가능하면 로컬도 Node.js 22로 맞춘다.

프로젝트 루트에서 실행한다.

```powershell
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 열고 설정된 로컬 계정의 아이디·비밀번호를 입력한 뒤 **로그인 하기**를 누른다. Firebase 설정이 없는 로컬 개발에서는 서버 인증 후 샘플 작업공간으로 시작한다. 미리보기는 실제 인스타그램 인증과 DM 발송을 하지 않으며, 자동화 변경 사항은 브라우저 localStorage에만 저장한다. 발송 내역은 샘플이다.

실제 Firebase 설정이 있더라도 미리보기가 필요하면 `.env.local`에 `VITE_DEMO_MODE=true`를 설정한다. **운영 배포에서는 false로 설정한다.** 프로덕션 빌드는 Firebase 미설정만으로 미리보기를 자동 활성화하지 않는다.

## 로컬 로그인

- 서버 전용 `.local/auth.json`에는 무작위 솔트, 아이디의 SHA-256 해시, 비밀번호의 scrypt 해시만 저장한다. 이 파일은 Git에서 제외되며 Vite의 파일 제공 차단 목록에도 포함한다. 실제 아이디·비밀번호는 소스·README·클라이언트 환경변수에 기록하지 않는다.
- `server/localAuth.ts`가 서버에서 검증하고, 8시간짜리 무작위 세션을 HttpOnly·SameSite=Strict 쿠키로 발급한다. 로그아웃·만료·서버 재시작 시 세션을 사용할 수 없다. 로컬 HTTP 전용이므로 Secure 쿠키를 사용하지 않는다.
- 로컬 주소와 동일 출처만 허용하며, 5분에 5회 로그인 시도로 제한한다. 예전 sessionStorage 로그인 플래그는 더 이상 인증에 사용하지 않는다.
- 계정 파일이 없는 새 체크아웃에서는 로그인이 차단된다. 신뢰할 수 있는 로컬 환경에서 별도로 계정을 준비해야 하며 기본 비밀번호를 자동 생성하지 않는다.
- 이 로그인은 `npm run dev`에서 샘플 작업공간을 여는 용도다. 샘플은 클라이언트 데이터이며 이 기능이 실제 고객 데이터를 보호하는 서버 인증을 대체하지 않는다. 정적 빌드·`npm run preview`·Firebase Hosting에는 이 로컬 인증 서버가 포함되지 않는다. 배포 시 Firebase Authentication과 Firestore 권한을 설정해야 한다.

## 프로젝트 구조

```text
src/
  app/                         라우터와 로그인 보호
  components/layout/           사이드바, 공통 레이아웃, 브랜드
  components/ui/               버튼, 필드, 모달, 상태 배지
  features/auth/               로컬 서버·Firebase 인증
  features/workspace/          작업공간 데이터 서비스·상태·샘플
  features/automations/        폼 훅, 조건 검증, 단계별 편집 컴포넌트
  features/dashboard/         요약 카드, 발송 추이, 연결 카드
  features/deliveries/         기록 표, 상세 패널
  pages/                      6가지 페이지
  lib/                        Firebase 초기화·API·표시 유틸리티
  styles/                     공통·레이아웃·화면별 스타일
server/                       로컬 개발 서버 인증과 테스트
functions/src/                Firebase 서버 코드
firestore.rules               작업공간별 조회 제한, 클라이언트 쓰기 차단
```

브랜드는 **HOOKIT STUDIO**이며, 명함의 블루 색상과 원형 심볼을 웹용 SVG·CSS로 반영했다. 사이트는 화이트 배경에 블루 포인트를 사용하며, 로그인과 대시보드도 밝은 화면으로 통일한다. 게시물 이미지는 샘플이다. 기존 미리보기 데이터와 발송된 버튼의 호환성을 위해 내부 저장 키·postback 접두사 `follin`은 유지한다.

## Firebase 실제 연결

1. 본인 Firebase 프로젝트에서 웹 앱, Authentication의 이메일/비밀번호 로그인, Firestore를 준비한다.
2. `.env.example`을 `.env.local`로 복사하고 웹 앱 설정값을 입력한다. `VITE_DEMO_MODE=false`로 둔다.
3. Firebase Authentication 관리 화면에서 본인 계정 1개를 만든다. 비밀번호는 소스 코드나 채팅에 기록하지 않는다.
4. 신뢰할 수 있는 환경의 Application Default Credentials를 설정하고 서버 패키지를 설치·빌드한다.

```powershell
Push-Location functions
npm install
Pop-Location
npm run server:build
```

기존 Authentication 사용자의 UID와 새로운 작업공간 ID로 아래 초기화 스크립트를 실행한다. 기존 데이터는 덮어쓰지 않는다.

```powershell
node functions/lib/bootstrap.js YOUR_AUTH_UID my-workspace
```

스크립트는 `users/{uid}`, `workspaces/{workspaceId}`와 비공개 발송 설정을 만든다. 서버는 JWT와 작업공간 소속·상태를 검증한다. **클라이언트는 캠페인도 Firestore에 직접 쓰지 않고 서버 API를 사용한다.**

`.firebaserc`의 기본 프로젝트는 `hookit-studio`로 설정되어 있다. Firebase CLI 관리 작업에는 별도 Google 로그인이 필요하며, Admin SDK 초기화에는 Application Default Credentials가 필요하다. 현재 전달받은 관리자 UID와 초기 문서 내용은 Git에서 제외되는 `.local/firebase-owner.json`에 준비해 두었다. 이 파일 저장만으로 실제 Firebase 사용자 권한이나 DB 문서가 생성되지는 않는다.

```powershell
firebase use --add
npm run build
npm run deploy:spark
```

Firebase 웹 앱 설정은 `.env.local`에 저장되어 있다. 관리자 권한 및 Firestore 설정 검증 전까지 `.env.development.local`의 `VITE_DEMO_MODE=true`로 기존 로컬 로그인을 유지한다. 확인이 끝나면 false로 변경한다. 실제 관리자 문서 생성, 규칙 및 서버 배포 여부는 Firebase 콘솔에서 확인해야 한다.

## Spark 운영 원칙

Firebase는 Spark로 유지한다. 등록된 결제 수단과 실제 프로젝트 요금제는 별도로 확인한다. 로컬 배포 설정 수정은 콘솔 요금제를 바꾸지 않는다. 기본 배포 대상은 Hosting·Firestore 규칙·인덱스이며 Functions는 제외했다. `functions/`는 이전 대상인 서버 초안으로 남겨 둔다. Render용 독립 서버 코드는 준비되었다. 실제 배포와 Meta 연결 전에는 인스타그램 연결 및 자동 DM을 운영할 수 없다. 최신 배포 순서는 [Render 안내](RENDER.md)를 따른다.

## 인스타그램 공식 인증 설정 — 기존 Functions 초안 참고, 서버 이전 후 갱신 필요

서버는 Instagram Login 흐름으로 구성했다. 실제 Meta 앱 권한과 API 버전에 맞는지 검증해야 한다.

1. Meta 앱에서 Instagram Login과 필요한 계정·댓글·메시지 권한을 준비한다.
2. `functions/.env.example`을 참고해 `functions/.env.YOUR_PROJECT_ID`를 작성한다.
3. `APP_ORIGIN`에는 웹 앱의 정확한 HTTPS origin, `API_BASE_URL`에는 배포된 `api` 함수 주소를 설정한다. `META_APP_ID`, 지원되는 `META_GRAPH_VERSION`도 입력한다.
4. 아래 비밀값은 Firebase Secret Manager에 저장한다. 프런트엔드 `VITE_` 변수에 넣지 않는다.

```powershell
firebase functions:secrets:set META_APP_SECRET
firebase functions:secrets:set META_WEBHOOK_VERIFY_TOKEN
firebase functions:secrets:set TOKEN_ENCRYPTION_KEY
```

`TOKEN_ENCRYPTION_KEY`는 무작위 32바이트를 Base64로 인코딩한 값이다. 토큰은 이 키를 사용하는 AES-256-GCM으로 암호화한다. 여기서 Base64는 암호화 키의 저장 형식이며, 비밀번호를 숨기는 용도가 아니다.

Meta 앱에 등록할 주소:

- OAuth 콜백: `API_BASE_URL/instagram/callback`
- 댓글·메시지 웹훅: `https://asia-northeast3-YOUR_PROJECT_ID.cloudfunctions.net/instagramWebhook`

서버의 OAuth state는 10분 만료·1회 사용이며 요청한 사용자와 작업공간에 연결된다. 웹훅은 원문 본문에 대한 Meta HMAC 서명을 검증한다. 접근 토큰은 서버 전용 문서에 보관하고 공개 연결 문서에는 사용자명·연결 상태만 둔다.

설정 후 **인스타그램 연결하기 → Meta 인증 → 게시물 선택** 흐름을 확인한다. 로컬 프런트엔드와 배포된 서버를 동시에 사용할 경우 CORS origin을 명시적으로 맞춰야 하며, 개발용 설정을 운영 설정과 혼용하지 않는다.

## 실제 발송을 켜기 전

현재 서버에는 댓글 기반 첫 DM, 버튼 재확인, 팔로우 조회, 링크 DM, 공개 대댓글 처리 코드가 있다. **실제 Meta 계정으로 검증하지 않았으므로 기본적으로 발송 활성화를 차단한다.** 초안 저장과 인스타그램 연결은 별개로 사용할 수 있다.

README의 API 검증 항목을 테스트용 계정으로 통과한 뒤에만 신뢰할 수 있는 관리 환경에서 아래 문서를 변경한다.

```text
workspaces/{workspaceId}/privateConfig/automation
  enabled: true
```

이 값은 브라우저에서 읽거나 바꿀 수 없다. 값을 켜기 전에 반드시 확인할 항목:

- 실제 앱 버전에서 Private Reply가 최초 버튼 메시지를 지원하는지
- 버튼 postback이 수신되고 후속 메시징 허용 조건을 충족하는지
- `is_user_follow_business`가 실제 팔로워·미팔로워 상태를 반환하는지
- 최초 DM 7일, 후속 메시지 24시간 등 구현에 사용한 제한이 해당 API 조건과 일치하는지
- 댓글 작성자 ID와 메시징 사용자 ID가 정확히 연결되는지
- 첫 DM 성공 후에만 공개 대댓글이 달리는지
- 반복 댓글·웹훅 재전송·버튼 연속 클릭에서 중복 발송이 없는지

실제 API 조건이 다르면 코드를 수정하고 검증해야 한다. 값을 true로 바꾸는 것 자체가 연동 검증을 대신하지 않는다.

## 현재 구현 범위와 제한

구현:

- 6개 React 페이지와 반응형 스타일
- 미리보기 자동화 생성·초안 저장·편집·복제·활성 상태 변경과 저장 유지
- 키워드, 모든 댓글, 링크 1~2개 설정 및 DM 흐름 미리보기
- 발송 기록 검색·필터·페이지 이동·상세 패널
- Firebase 인증, 작업공간 조회, 서버를 통한 설정 저장
- OAuth 시작·콜백, 토큰 암호화, 게시물 조회, 웹훅 큐와 발송 처리의 서버 초안

운영 전 남은 검증·보완:

- 실계정 OAuth·팔로우 조회·DM 전체 흐름과 Firestore 보안 규칙의 에뮬레이터 통합 검증
- 임시 API 실패에 대한 제한된 재시도, 비정상 종료된 작업의 복구·운영 알림. 현재는 결과가 불분명한 외부 발송을 무조건 재시도하지 않는다.
- 토큰 자동 갱신·권한 해제 이벤트 처리. 현재는 토큰 만료 시 수동 재연결 경로를 사용한다.
- 대량 기록 조회. 초기에는 자동화 최대 200개, 최근 발송 기록 최대 500개, 게시물 최근 50개를 조회한다. 기록 표의 페이지 이동은 이 조회 범위 내에서 수행하며 통계도 해당 범위 기준이다.
- 실제 앱에 맞는 API 호출량 제한과 데이터 보관·삭제 작업
- 현재 게시물별 자동화 잠금은 서버 트랜잭션, 수신자별 중복 방지는 예약 기록으로 처리한다. 외부 발송과 DB 변경을 하나의 트랜잭션으로 만들 수 없으므로 비정상 종료 시 결과 불명 상태를 확인하는 복구 절차가 필요하다.

회원가입, 고객 계정·구독 기간 관리와 결제는 계획대로 2차 범위다.

## 검증 명령

```powershell
npm test
npm run build
npm run server:build
node --test functions/lib/security.test.js functions/lib/schema.test.js
```

단위 테스트는 댓글 조건, 필수 설정·URL 검증, 서버 소유권 필드 삽입 방지, 웹훅 서명, 암호화 변조 검출을 확인한다. 외부 Meta API 연동 성공이나 브라우저 전체 사용 흐름을 보장하는 테스트는 아니다.
