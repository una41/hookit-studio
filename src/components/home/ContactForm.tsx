import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import BaseButton from '../common/BaseButton'
import { submitInquiry } from '../../services/inquiryService'

interface IContactFormProps {
  onBack: () => void
  onSubmitted: () => void
}

interface IContactForm {
  job: string
  job_other: string
  name: string
  phone: string
  account: string
  message: string
}

const OTHER_JOB = '기타'
const JOB_OPTION_LIST: string[] = ['변호사', '의사', '세무사', OTHER_JOB]

const INITIAL_FORM: IContactForm = {
  job: JOB_OPTION_LIST[0],
  job_other: '',
  name: '',
  phone: '',
  account: '',
  message: '',
}

export default function ContactForm({ onBack, onSubmitted }: IContactFormProps) {
  const [form, setForm] = useState<IContactForm>(INITIAL_FORM)
  const [is_agreed, setIsAgreed] = useState<boolean>(false)
  const [is_submitting, setIsSubmitting] = useState<boolean>(false)
  const [error_message, setErrorMessage] = useState<string>('')
  // 스팸 방지용 숨김 입력칸: 사람은 비워 두고, 봇만 채움
  const [honeypot, setHoneypot] = useState<string>('')

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    // 봇이 채운 경우 저장하지 않고 성공한 것처럼 넘김
    if (honeypot) {
      onSubmitted()
      return
    }

    setIsSubmitting(true)
    try {
      await submitInquiry({
        job: form.job === OTHER_JOB ? `${OTHER_JOB} (${form.job_other})` : form.job,
        name: form.name,
        phone: form.phone,
        account: form.account,
        message: form.message,
      })
      setForm(INITIAL_FORM)
      setIsAgreed(false)
      onSubmitted()
    } catch {
      setErrorMessage('접수에 실패했어요. 잠시 후 다시 시도하거나 카카오톡으로 문의해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='bx_contact_formwrap'>
      <button type='button' className='btn_close' aria-label='닫기' onClick={onBack}>
        ×
      </button>
      <button type='button' className='btn_back' onClick={onBack}>
        ← 다른 방법으로 문의
      </button>
      <strong className='tit_message'>무료 상담 신청</strong>
      <p className='txt_message'>1분이면 충분해요. 담당 PD가 직접 연락드립니다.</p>
      <form className='form_contact' onSubmit={handleSubmit}>
        <fieldset className='bx_field'>
          <legend className='txt_field'>
            직업 <span className='txt_required'>*</span>
          </legend>
          <div className='list_job'>
            {JOB_OPTION_LIST.map((job_name) => (
              <label className='lab_pill' key={job_name}>
                <input
                  className='ipt_radio'
                  type='radio'
                  name='job'
                  value={job_name}
                  checked={form.job === job_name}
                  onChange={handleChange}
                />
                <span>{job_name}</span>
              </label>
            ))}
          </div>
          {form.job === OTHER_JOB && (
            <input
              className='ipt_text'
              name='job_other'
              placeholder='직업을 직접 입력해 주세요'
              value={form.job_other}
              onChange={handleChange}
              required
            />
          )}
        </fieldset>
        <div className='bx_field_row'>
          <label className='lab_field'>
            <span className='txt_field'>
              성함 <span className='txt_required'>*</span>
            </span>
            <input className='ipt_text' name='name' placeholder='홍길동' value={form.name} onChange={handleChange} required />
          </label>
          <label className='lab_field'>
            <span className='txt_field'>
              연락처 <span className='txt_required'>*</span>
            </span>
            <input
              className='ipt_text'
              name='phone'
              type='tel'
              placeholder='010-0000-0000'
              value={form.phone}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <label className='lab_field'>
          <span className='txt_field'>운영 중인 계정 (선택)</span>
          <input
            className='ipt_text'
            name='account'
            placeholder='인스타그램 @계정 또는 채널 주소'
            value={form.account}
            onChange={handleChange}
          />
        </label>
        <label className='lab_field'>
          <span className='txt_field'>문의 내용</span>
          <textarea
            className='ipt_text'
            name='message'
            rows={3}
            placeholder='목표나 고민을 편하게 적어 주세요.'
            value={form.message}
            onChange={handleChange}
          />
        </label>
        <label className='lab_agree'>
          <input className='ipt_check' type='checkbox' checked={is_agreed} onChange={(event) => setIsAgreed(event.target.checked)} required />
          <span>개인정보 수집·이용에 동의합니다 (필수)</span>
        </label>
        <input
          className='ipt_honeypot'
          name='website'
          tabIndex={-1}
          autoComplete='off'
          aria-hidden='true'
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
        {error_message && <p className='txt_error'>{error_message}</p>}
        <BaseButton type='submit' modifier='full' disabled={is_submitting}>
          {is_submitting ? '접수 중...' : '무료 상담 신청하기 →'}
        </BaseButton>
      </form>
    </div>
  )
}
