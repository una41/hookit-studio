import BaseButton from '../common/BaseButton'
import { CONTACT_INFO } from '../../constants/siteContent'

interface IContactChoiceProps {
  onOpenForm: () => void
}

// 문의 방법 선택 화면: 카카오톡 또는 문의 양식
export default function ContactChoice({ onOpenForm }: IContactChoiceProps) {
  return (
    <div className='bx_contact_choice'>
      <strong className='tit_message'>편한 방법으로 문의하세요</strong>
      <p className='txt_message'>
        카카오톡으로 바로 대화하거나,
        <br />
        문의 양식을 남겨 주세요.
      </p>
      <BaseButton href={CONTACT_INFO.kakao_url} modifier='kakao full'>
        <svg className='ico_kakao' viewBox='0 0 24 24' width='18' height='18' aria-hidden='true'>
          <path d='M12 3C6.5 3 2 6.6 2 11c0 2.8 1.8 5.3 4.6 6.7l-1 3.6c-.1.3.3.6.6.4l4.3-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.6 10-8S17.5 3 12 3z' />
        </svg>
        카카오톡 문의하기
      </BaseButton>
      <BaseButton modifier='full' onClick={onOpenForm}>
        문의하기 →
      </BaseButton>
      <p className='txt_note'>남겨주신 연락처로 48시간 내 연락드립니다.</p>
    </div>
  )
}
