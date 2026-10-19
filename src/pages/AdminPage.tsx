import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { getFirebaseAuth } from '../firebase'
import BaseButton from '../components/common/BaseButton'
import ScrollTopButton from '../components/common/ScrollTopButton'
import AdminLogin from '../components/admin/AdminLogin'
import AdminInquirySection from '../components/admin/AdminInquirySection'
import AdminSurveySection from '../components/admin/AdminSurveySection'

const MENU_LIST: { name: string; label: string; path: string }[] = [
  { name: 'inquiries', label: '문의 관리', path: '/admin' },
  { name: 'surveys', label: '설문 관리', path: '/admin/surveys' },
]

// 주소를 조각으로 나눔: /admin/surveys/abc → ['admin', 'surveys', 'abc']
const getPathSegmentList = (): string[] => window.location.pathname.split('/').filter(Boolean)

// 관리 페이지 (/admin): 아이디와 비밀번호로 로그인한 관리자만 볼 수 있음
// 왼쪽 메뉴: 문의 관리(/admin, /admin/inquiries/번호), 설문 관리(/admin/surveys, /admin/surveys/번호)
export default function AdminPage() {
  const [admin_user, setAdminUser] = useState<User | null>(null)
  const [is_auth_ready, setIsAuthReady] = useState<boolean>(false)
  const [error_message, setErrorMessage] = useState<string>('')
  const [path_segment_list, setPathSegmentList] = useState<string[]>(getPathSegmentList)

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path)
    setPathSegmentList(getPathSegmentList())
    window.scrollTo({ top: 0 })
  }

  // 브라우저 뒤로가기, 앞으로가기에 맞춰 화면 전환
  useEffect(() => {
    const handlePopState = () => setPathSegmentList(getPathSegmentList())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 검색에 노출되지 않도록 설정
  useEffect(() => {
    document.title = '관리자 | HOOKIT STUDIO'
    const robots_meta = document.createElement('meta')
    robots_meta.name = 'robots'
    robots_meta.content = 'noindex'
    document.head.appendChild(robots_meta)
    return () => robots_meta.remove()
  }, [])

  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), (user) => {
        setAdminUser(user)
        setIsAuthReady(true)
      })
    } catch {
      setErrorMessage('Firebase 설정(.env.local)이 필요해요.')
      setIsAuthReady(true)
    }
  }, [])

  if (!is_auth_ready) return null

  if (!admin_user) {
    return (
      <div className='bx_admin'>
        <div className='bx_admin_login'>
          <AdminLogin />
          {error_message && <p className='txt_error'>{error_message}</p>}
        </div>
      </div>
    )
  }

  const current_menu = path_segment_list[1] === 'surveys' ? 'surveys' : 'inquiries'
  const detail_id = path_segment_list[1] === 'surveys' || path_segment_list[1] === 'inquiries' ? (path_segment_list[2] ?? '') : ''

  return (
    <div className='bx_admin'>
      <header className='bx_admin_header'>
        <strong className='tit_admin'>HOOKIT 관리자</strong>
        <BaseButton modifier='logout' onClick={() => signOut(getFirebaseAuth())}>
          logout
        </BaseButton>
      </header>
      <div className='bx_admin_body'>
        <nav className='snb_admin'>
          {MENU_LIST.map((menu) => (
            <a
              key={menu.name}
              href={menu.path}
              className={current_menu === menu.name ? 'link_menu active' : 'link_menu'}
              onClick={(event) => {
                event.preventDefault()
                navigateTo(menu.path)
              }}
            >
              {menu.label}
            </a>
          ))}
        </nav>
        <main className='bx_admin_content'>
          {current_menu === 'surveys' ? (
            <AdminSurveySection survey_id={detail_id} navigateTo={navigateTo} />
          ) : (
            <AdminInquirySection inquiry_id={detail_id} navigateTo={navigateTo} />
          )}
        </main>
      </div>
      <ScrollTopButton />
    </div>
  )
}
