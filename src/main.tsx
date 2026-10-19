import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/scss/main.scss'
import App from './App.tsx'

const AdminPage = lazy(() => import('./pages/AdminPage'))
const SurveyPage = lazy(() => import('./pages/SurveyPage'))

// /admin 은 관리자 페이지, /survey 는 설문 페이지, 그 외에는 홈페이지
const is_admin_path = window.location.pathname.startsWith('/admin')
const is_survey_path = window.location.pathname.startsWith('/survey')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {is_admin_path || is_survey_path ? (
      <Suspense fallback={null}>{is_admin_path ? <AdminPage /> : <SurveyPage />}</Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
