# Spark + Render 무료 서버

Firebase Authentication·Firestore·Hosting은 기존 Spark 프로젝트를 유지한다. 서버는 Render의 Free Web Service 하나에서 실행한다. `render.yaml`은 `plan: free`를 명시하며 유료 백그라운드 워커·DB·크론을 만들지 않는다.

## 현재 상태

코드 이전 및 로컬 검증 단계다. Render 서버를 생성하거나 서비스 계정 키를 업로드하지 않았다. Meta 연결·실제 DM도 검증 전이다.

## 배포 순서

1. 프로젝트를 본인의 비공개 GitHub 저장소에 올린다. `.env*`, `.local/`, 서비스 계정 JSON, `node_modules/`는 올리지 않는다. 서비스 계정 키는 기존 `C:\Users\lyn62\keys\hookit.json`에 보관한다.
2. https://dashboard.render.com/ 에 로그인하고 New → Blueprint에서 해당 저장소의 `render.yaml`을 선택한다. 요금제는 Free인지 확인한다.
3. 서비스의 Secret Files에 `hookit.json`을 등록한다. 파일 내용은 사용자가 직접 입력하며 채팅·저장소에 올리지 않는다. 환경변수 `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/hookit.json`으로 읽는다. 이 서비스 계정은 Firestore 데이터 접근과 Firebase Auth 토큰 검증 권한이 필요하다.
4. 환경변수에 Meta 앱 ID·앱 시크릿·앱에서 지원하는 Graph 버전, 웹훅 검증 토큰, 토큰 암호화 키를 설정한다. 암호화 키는 무작위 32바이트를 Base64로 인코딩한 값이다. `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_VERSION`, `META_WEBHOOK_VERIFY_TOKEN`, `TOKEN_ENCRYPTION_KEY`가 모두 있어야 서버가 시작한다. 값을 프런트엔드에 넣지 않는다.
5. Render가 제공하는 실제 서비스 URL을 확인한다. `API_BASE_URL`은 기본적으로 `RENDER_EXTERNAL_URL` 뒤에 `/api`를 붙여 자동 설정된다. `APP_ORIGIN=https://hookit-studio.web.app`이다.
6. `https://실제서버주소/healthz`의 응답이 200이고 `ready: true`인지 확인한다. Firestore 이벤트 큐 조회가 성공해야 준비 상태가 된다.
7. 웹 프로젝트 `.env.local`에 `VITE_API_URL=https://실제서버주소/api`를 추가한 뒤 `npm run deploy:spark`를 실행한다.
8. Meta 앱에서 로그인 콜백은 `https://실제서버주소/api/instagram/callback`, 웹훅은 `https://실제서버주소/webhooks/instagram`으로 등록한다. 검증 토큰은 서버에 저장한 값과 같아야 한다.
9. 관리자 로그인 → 인스타그램 연결 → 게시물 조회까지 확인한다. 실제 댓글·팔로우 확인·DM 테스트 준비 전에는 `workspaces/main/privateConfig/automation.enabled`를 false로 유지한다.

## 실행 구조와 제한

- `functions/src/standalone.ts`가 Express HTTP 서버와 Firestore pending 이벤트 구독을 실행한다. Firebase Functions 배포·이벤트 트리거·Secret Manager는 필요하지 않다. 기존 secret 접근자는 Render 환경변수를 읽는다.
- 웹훅은 원문 서명 검증 후 Firestore에 저장하고 응답한다. 이벤트 소비자는 최대 20개씩 읽어 순서대로 처리한다. 트랜잭션 예약으로 중복 발송을 억제한다.
- 서비스 재시작 시 pending 문서는 다시 처리한다. 발송 중 중단되어 processing/unknown 상태인 건은 자동 재전송하지 않는다. Meta 발송 여부를 확인한 뒤 수동 복구해야 한다.
- Free Web Service는 요청이 15분간 없으면 휴면 상태가 된다. 기동 지연으로 웹훅 검증 또는 댓글 전달이 지연·실패할 수 있다. Meta의 재전송 성공이나 즉시 발송을 보장하지 않는다. 상시 운영 검증이 끝난 구성으로 표현하지 않는다.
- 무료 한도 및 서비스 중단 정책이 적용된다. 연결된 Firestore 구독·문서 읽기/쓰기도 Spark 한도를 사용한다. 무료 한도를 회피하려는 인위적 keep-alive는 사용하지 않는다.

공식 문서: https://render.com/docs/free · https://render.com/docs/blueprint-spec · https://render.com/docs/configure-environment-variables

Meta 앱 생성: https://developers.facebook.com/apps/

Instagram Login 안내: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
