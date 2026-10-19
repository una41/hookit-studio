import { useState } from 'react'
import { deleteInquiry, updateInquiry } from '../../services/inquiryService'
import type { IInquiry, TInquiryStatus } from '../../types/inquiry'

interface IAdminInquiryItemProps {
  inquiry: IInquiry
}

export const STATUS_OPTION_LIST: { value: TInquiryStatus; label: string }[] = [
  { value: 'new', label: '신규' },
  { value: 'progress', label: '상담 중' },
  { value: 'contract', label: '계약' },
  { value: 'hold', label: '보류' },
]

export default function AdminInquiryItem({ inquiry }: IAdminInquiryItemProps) {
  const [memo_draft, setMemoDraft] = useState<string>(inquiry.memo)
  const [error_message, setErrorMessage] = useState<string>('')

  const saveChanges = async (changes: { status?: TInquiryStatus; memo?: string }) => {
    setErrorMessage('')
    try {
      await updateInquiry(inquiry.id, changes)
    } catch {
      setErrorMessage('저장에 실패했어요. 다시 시도해 주세요.')
    }
  }

  // 삭제는 되돌릴 수 없으므로 한 번 더 확인
  const handleDelete = async () => {
    if (!window.confirm(`${inquiry.name}님의 문의를 삭제할까요? 되돌릴 수 없어요.`)) return
    setErrorMessage('')
    try {
      await deleteInquiry(inquiry.id)
    } catch {
      setErrorMessage('삭제에 실패했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <li className='item_inquiry'>
      <div className='bx_inquiry_head'>
        <strong className='txt_inquiry_name'>{inquiry.name}</strong>
        <span className='txt_inquiry_job'>{inquiry.job}</span>
        <time className='txt_inquiry_date'>{inquiry.createdAt ? inquiry.createdAt.toLocaleString('ko-KR') : '-'}</time>
      </div>
      <p className='txt_inquiry_row'>
        <span className='txt_label'>연락처</span>
        <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>
      </p>
      <p className='txt_inquiry_row'>
        <span className='txt_label'>운영 계정</span>
        {inquiry.account || '-'}
      </p>
      <p className='txt_inquiry_message'>{inquiry.message || '(문의 내용 없음)'}</p>
      <div className='bx_inquiry_control'>
        <select
          className='sel_basic'
          value={inquiry.status}
          onChange={(event) => saveChanges({ status: event.target.value as TInquiryStatus })}
        >
          {STATUS_OPTION_LIST.map((status_option) => (
            <option key={status_option.value} value={status_option.value}>
              {status_option.label}
            </option>
          ))}
        </select>
        <textarea
          className='ipt_text'
          rows={2}
          placeholder='메모 (입력 후 바깥을 누르면 저장)'
          value={memo_draft}
          onChange={(event) => setMemoDraft(event.target.value)}
          onBlur={() => {
            if (memo_draft !== inquiry.memo) saveChanges({ memo: memo_draft })
          }}
        />
        <button type='button' className='btn_text' onClick={handleDelete}>
          삭제
        </button>
      </div>
      {error_message && <p className='txt_error'>{error_message}</p>}
    </li>
  )
}
