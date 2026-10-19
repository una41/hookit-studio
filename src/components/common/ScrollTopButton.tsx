import { useEffect, useState } from 'react'

// 이 높이(px)보다 아래로 내려가면 버튼을 보여줌
const SHOW_SCROLL_POSITION = 300

// 화면 오른쪽 아래에 떠 있다가 누르면 맨 위로 올라가는 버튼
export default function ScrollTopButton() {
  const [is_visible, setIsVisible] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > SHOW_SCROLL_POSITION)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      type='button'
      className={is_visible ? 'btn_top visible' : 'btn_top'}
      aria-label='맨 위로'
      tabIndex={is_visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
}
