import { lazy, StrictMode, Suspense } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './assets/scss/main.scss'
import App from './App.tsx'

const AdminPage = lazy(() => import('./pages/AdminPage'))
const SurveyPage = lazy(() => import('./pages/SurveyPage'))

// /admin 은 관리자 페이지, /survey 는 설문 페이지, 그 외에는 홈페이지
const is_admin_path = window.location.pathname.startsWith('/admin')
const is_survey_path = window.location.pathname.startsWith('/survey')

const root_element = document.getElementById('root')!
const app_element = (
  <StrictMode>
    {is_admin_path || is_survey_path ? (
      <Suspense fallback={null}>{is_admin_path ? <AdminPage /> : <SurveyPage />}</Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
)

// 빌드 때 미리 만들어 둔 홈 화면이 있으면 그 위에 이어 붙이고, 없으면 새로 그림
if (!is_admin_path && !is_survey_path && root_element.hasChildNodes()) {
  hydrateRoot(root_element, app_element)
} else {
  createRoot(root_element).render(app_element)
}
