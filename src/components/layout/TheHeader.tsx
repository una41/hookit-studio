import { useEffect, useState } from 'react'
import Logo from '../common/Logo'
import BaseButton from '../common/BaseButton'

// 헤더 높이(50px + 아래 선 1px)
const HEADER_HEIGHT = 51
// 소개 섹션 윗면이 (헤더 높이 + 헤더 높이) 위치까지 올라오면 흰색 헤더로 전환
// 메뉴로 이동하면 섹션이 헤더 바로 아래(헤더 높이)에 멈추므로 항상 여기에 포함됨
const HEADER_SWITCH_OFFSET = HEADER_HEIGHT * 2

export default function TheHeader() {
  const [is_light, setIsLight] = useState<boolean>(false)

  // 소개 섹션 윗부분이 헤더에 닿으면 흰색 헤더로 전환
  useEffect(() => {
    const handleScroll = () => {
      const intro_section = document.getElementById('why')
      setIsLight(!!intro_section && intro_section.getBoundingClientRect().top <= HEADER_SWITCH_OFFSET)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={is_light ? 'bx_header light' : 'bx_header'}>
      <div className='bx_inner'>
        <a href='#top' className='link_logo'>
          <Logo modifier='small' />
        </a>
        <nav className='gnb'>
          <a href='#why'>소개</a>
          <a href='#service'>서비스</a>
          <a href='#process'>프로세스</a>
          <a href='#contact'>문의하기</a>
        </nav>
        <BaseButton href='#contact' modifier='small'>
          무료 상담 신청 →
        </BaseButton>
      </div>
    </header>
  )
}
