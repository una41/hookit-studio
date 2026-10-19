import { useState } from 'react'
import type { FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { getFirebaseAuth } from '../../firebase'
import { ADMIN_LOGIN_DOMAIN } from '../../constants/siteContent'
import BaseButton from '../common/BaseButton'

export default function AdminLogin() {
  const [login_id, setLoginId] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error_message, setErrorMessage] = useState<string>('')
  const [is_loading, setIsLoading] = useState<boolean>(false)

  // 아이디만 입력하면 도메인을 붙여 Firebase 계정(이메일 형식)으로 로그인
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)
    try {
      const login_email = login_id.includes('@') ? login_id : `${login_id}@${ADMIN_LOGIN_DOMAIN}`
      await signInWithEmailAndPassword(getFirebaseAuth(), login_email, password)
    } catch {
      setErrorMessage('아이디 또는 비밀번호가 맞지 않아요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className='form_admin_login' onSubmit={handleSubmit}>
      <strong className='tit_admin'>문의 관리</strong>
      <label className='lab_field'>
        <span className='txt_field'>아이디</span>
        <input
          className='ipt_text'
          value={login_id}
          autoComplete='username'
          onChange={(event) => setLoginId(event.target.value)}
          required
        />
      </label>
      <label className='lab_field'>
        <span className='txt_field'>비밀번호</span>
        <input
          className='ipt_text'
          type='password'
          value={password}
          autoComplete='current-password'
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error_message && <p className='txt_error'>{error_message}</p>}
      <BaseButton type='submit' modifier='full' disabled={is_loading}>
        {is_loading ? '로그인 중...' : '로그인'}
      </BaseButton>
    </form>
  )
}
