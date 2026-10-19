import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { getFirebaseAuth } from '../firebase'
import { subscribeInquiryList } from '../services/inquiryService'
import AdminLogin from '../components/admin/AdminLogin'
import AdminInquiryList from '../components/admin/AdminInquiryList'
import type { IInquiry } from '../types/inquiry'

// 문의 관리 페이지 (/admin): 아이디와 비밀번호로 로그인한 관리자만 문의 목록을 볼 수 있음
export default function AdminPage() {
  const [admin_user, setAdminUser] = useState<User | null>(null)
  const [is_auth_ready, setIsAuthReady] = useState<boolean>(false)
  const [inquiry_list, setInquiryList] = useState<IInquiry[]>([])
  const [error_message, setErrorMessage] = useState<string>('')

  // 검색에 노출되지 않도록 설정
  useEffect(() => {
    document.title = '문의 관리 | HOOKIT STUDIO'
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

  useEffect(() => {
    if (!admin_user) return
    setErrorMessage('')
    return subscribeInquiryList(setInquiryList, () =>
      setErrorMessage('문의 내용을 불러올 수 없어요. 관리자 계정이 맞는지 확인해 주세요.'),
    )
  }, [admin_user])

  if (!is_auth_ready) return null

  return (
    <div className='bx_admin'>
      <div className='bx_admin_inner'>
        {admin_user ? (
          <>
            <div className='bx_admin_head'>
              <strong className='tit_admin'>문의 관리</strong>
              <button type='button' className='btn_text' onClick={() => signOut(getFirebaseAuth())}>
                로그아웃
              </button>
            </div>
            {error_message ? <p className='txt_error'>{error_message}</p> : <AdminInquiryList inquiry_list={inquiry_list} />}
          </>
        ) : (
          <>
            <AdminLogin />
            {error_message && <p className='txt_error'>{error_message}</p>}
          </>
        )}
      </div>
    </div>
  )
}
