import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/scss/main.scss'
import App from './App.tsx'

const AdminPage = lazy(() => import('./pages/AdminPage'))

// /admin 주소로 들어오면 문의 관리 페이지, 그 외에는 홈페이지
const is_admin_path = window.location.pathname.startsWith('/admin')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {is_admin_path ? (
      <Suspense fallback={null}>
        <AdminPage />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
