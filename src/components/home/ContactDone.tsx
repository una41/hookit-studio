import BaseButton from '../common/BaseButton'
import { CONTACT_INFO } from '../../constants/siteContent'

interface IContactDoneProps {
  onReset: () => void
}

// 문의가 저장된 뒤 보여주는 접수 완료 화면
export default function ContactDone({ onReset }: IContactDoneProps) {
  return (
    <div className='bx_contact_message'>
      <span className='ico_check' aria-hidden='true'>
        ✓
      </span>
      <strong className='tit_message'>상담 신청이 접수됐어요</strong>
      <p className='txt_message'>
        담당 PD가 48시간 내에
        <br />
        남겨주신 연락처로 연락드릴게요.
      </p>
      <BaseButton href={CONTACT_INFO.kakao_url} modifier='kakao full'>
        카카오톡으로 바로 대화하기
      </BaseButton>
      <button type='button' className='btn_text' onClick={onReset}>
        처음으로
      </button>
    </div>
  )
}
