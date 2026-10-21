import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

// 빌드할 때 홈 화면을 HTML 글자로 미리 만들어 둠 (검색엔진이 자바스크립트 없이도 본문을 읽도록)
export const render = (): string =>
  renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
