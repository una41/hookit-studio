import type { ReactNode } from 'react'

interface IBaseButtonProps {
  children: ReactNode
  href?: string
  modifier?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}

// href가 있으면 링크, 없으면 버튼으로 렌더링
export default function BaseButton({ children, href, modifier = '', type = 'button', disabled = false, onClick }: IBaseButtonProps) {
  const class_name = ['btn', modifier].join(' ').trim()

  if (href) {
    return (
      <a className={class_name} href={href}>
        {children}
      </a>
    )
  }

  return (
    <button className={class_name} type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
