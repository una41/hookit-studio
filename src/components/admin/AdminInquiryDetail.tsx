import { useState } from 'react'
import BaseButton from '../common/BaseButton'
import { STATUS_LABEL_MAP, STATUS_OPTION_LIST } from '../../constants/inquiryStatus'
import { deleteInquiry, updateInquiry } from '../../services/inquiryService'
import type { IInquiry, TInquiryStatus } from '../../types/inquiry'

interface IAdminInquiryDetailProps {
  inquiry: IInquiry
  onBack: () => void
}

// 문의 한 건의 상세 화면: 상태와 메모를 저장 버튼으로 저장, 삭제는 확인 후 처리
export default function AdminInquiryDetail({ inquiry, onBack }: IAdminInquiryDetailProps) {
  const [status_draft, setStatusDraft] = useState<TInquiryStatus>(inquiry.status)
  const [memo_draft, setMemoDraft] = useState<string>(inquiry.memo)
  const [is_working, setIsWorking] = useState<boolean>(false)
  const [notice_text, setNoticeText] = useState<string>('')
  const [is_error, setIsError] = useState<boolean>(false)

  const has_changes = status_draft !== inquiry.status || memo_draft !== inquiry.memo

  const showNotice = (text: string, error: boolean) => {
    setNoticeText(text)
    setIsError(error)
  }

  const handleSave = async () => {
    setIsWorking(true)
    showNotice('', false)
    try {
      await updateInquiry(inquiry.id, { status: status_draft, memo: memo_draft })
      showNotice('저장했어요.', false)
    } catch {
      showNotice('저장에 실패했어요. 다시 시도해 주세요.', true)
    } finally {
      setIsWorking(false)
    }
  }

  // 삭제는 되돌릴 수 없으므로 한 번 더 확인
  const handleDelete = async () => {
    if (!window.confirm(`${inquiry.name}님의 문의를 삭제할까요? 되돌릴 수 없어요.`)) return
    setIsWorking(true)
    showNotice('', false)
    try {
      await deleteInquiry(inquiry.id)
      onBack()
    } catch {
      showNotice('삭제에 실패했어요. 다시 시도해 주세요.', true)
      setIsWorking(false)
    }
  }

  return (
    <div className='bx_inquiry_detail'>
      <div className='bx_detail_top'>
        <BaseButton modifier='list' onClick={onBack}>
          목록
        </BaseButton>
      </div>
      <div className='card_inquiry'>
        <div className='bx_inquiry_head'>
          <strong className='txt_inquiry_name'>{inquiry.name}</strong>
          <span className='txt_inquiry_job'>{inquiry.job}</span>
          <span className={`txt_status ${inquiry.status}`}>{STATUS_LABEL_MAP[inquiry.status]}</span>
          <time className='txt_inquiry_date'>{inquiry.createdAt ? inquiry.createdAt.toLocaleString('ko-KR') : '-'}</time>
        </div>
        <dl className='list_inquiry_info'>
          <dt>연락처</dt>
          <dd>
            <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>
          </dd>
          <dt>운영 계정</dt>
          <dd>{inquiry.account || '-'}</dd>
        </dl>
        <p className='txt_inquiry_message'>{inquiry.message || '(문의 내용 없음)'}</p>
        <div className='bx_inquiry_control'>
          <label className='lab_field'>
            <span className='txt_field'>상태</span>
            <select className='sel_basic' value={status_draft} onChange={(event) => setStatusDraft(event.target.value as TInquiryStatus)}>
              {STATUS_OPTION_LIST.map((status_option) => (
                <option key={status_option.value} value={status_option.value}>
                  {status_option.label}
                </option>
              ))}
            </select>
          </label>
          <label className='lab_field'>
            <span className='txt_field'>메모</span>
            <textarea
              className='ipt_text'
              rows={4}
              placeholder='상담 내용이나 진행 상황을 적어 두세요.'
              value={memo_draft}
              onChange={(event) => setMemoDraft(event.target.value)}
            />
          </label>
        </div>
        <div className='bx_inquiry_action'>
          <p className={is_error ? 'txt_notice txt_error' : 'txt_notice'}>{notice_text}</p>
          <BaseButton modifier='line danger' disabled={is_working} onClick={handleDelete}>
            삭제
          </BaseButton>
          <BaseButton disabled={is_working || !has_changes} onClick={handleSave}>
            저장
          </BaseButton>
        </div>
      </div>
    </div>
  )
}
