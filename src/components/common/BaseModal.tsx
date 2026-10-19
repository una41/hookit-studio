import type { ReactNode } from 'react'
import BaseButton from './BaseButton'

interface IBaseModalProps {
  children: ReactNode
  confirm_label?: string
  onConfirm: () => void
}

// 가운데에 뜨는 안내 팝업: 확인 버튼을 눌러야 닫힘
export default function BaseModal({ children, confirm_label = '확인', onConfirm }: IBaseModalProps) {
  return (
    <div className='pop_wrap'>
      <div className='pop pop_message' role='dialog' aria-modal='true'>
        <p className='txt_pop'>{children}</p>
        <BaseButton modifier='full' onClick={onConfirm}>
          {confirm_label}
        </BaseButton>
      </div>
    </div>
  )
}
