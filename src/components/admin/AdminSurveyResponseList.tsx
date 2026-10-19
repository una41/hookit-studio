import { useState } from 'react'
import { useBulkSelect } from '../../hooks/useBulkSelect'
import { deleteSurveyResponse, deleteSurveyResponseList } from '../../services/surveyService'
import type { ISurveyResponse } from '../../types/survey'

interface IAdminSurveyResponseListProps {
  response_list: ISurveyResponse[]
}

// 한 설문의 응답 목록: 이메일 줄을 누르면 답변이 펼쳐지고, 체크박스로 골라 한 번에 삭제
export default function AdminSurveyResponseList({ response_list }: IAdminSurveyResponseListProps) {
  const [error_message, setErrorMessage] = useState<string>('')
  const [is_deleting, setIsDeleting] = useState<boolean>(false)
  const { selected_id_list, selected_id_set, toggle, setGroupChecked, clear } = useBulkSelect(response_list.map((response) => response.id))

  const is_all_selected = response_list.length > 0 && selected_id_list.length === response_list.length

  const handleDelete = async (response: ISurveyResponse) => {
    if (!window.confirm(`${response.email}님의 응답을 삭제할까요? 되돌릴 수 없어요.`)) return
    setErrorMessage('')
    try {
      await deleteSurveyResponse(response.id)
    } catch {
      setErrorMessage('삭제에 실패했어요. 다시 시도해 주세요.')
    }
  }

  // 선택한 응답을 한 번에 삭제 (되돌릴 수 없으므로 한 번 더 확인)
  const handleBulkDelete = async () => {
    if (!window.confirm(`선택한 ${selected_id_list.length}건을 삭제할까요? 되돌릴 수 없어요.`)) return
    setIsDeleting(true)
    setErrorMessage('')
    try {
      await deleteSurveyResponseList(selected_id_list)
      clear()
    } catch {
      setErrorMessage('삭제에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className='bx_survey_response'>
      <strong className='tit_page'>응답 {response_list.length}건</strong>
      {response_list.length > 0 && (
        <div className='bx_bulk_bar'>
          <label className='lab_check'>
            <input type='checkbox' checked={is_all_selected} onChange={(event) => setGroupChecked(response_list.map((response) => response.id), event.target.checked)} />
            <span>전체 선택</span>
          </label>
          {selected_id_list.length > 0 && (
            <>
              <span className='txt_bulk'>{selected_id_list.length}건 선택됨</span>
              <button type='button' className='btn_text btn_remove' disabled={is_deleting} onClick={handleBulkDelete}>
                선택 삭제
              </button>
            </>
          )}
        </div>
      )}
      {error_message && <p className='txt_error'>{error_message}</p>}
      {response_list.length === 0 ? (
        <p className='nodata'>아직 응답이 없어요.</p>
      ) : (
        <ul className='list_response'>
          {response_list.map((response) => (
            <li key={response.id}>
              <details>
                <summary>
                  <input
                    type='checkbox'
                    aria-label={`${response.email} 선택`}
                    checked={selected_id_set.has(response.id)}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => toggle(response.id)}
                  />
                  <span className='txt_response_email'>{response.email}</span>
                  <time className='txt_inquiry_date'>{response.createdAt ? response.createdAt.toLocaleString('ko-KR') : '-'}</time>
                </summary>
                <dl className='list_response_answer'>
                  {response.answers.map((answer, answer_index) => (
                    <div key={answer_index}>
                      <dt>{answer.question}</dt>
                      <dd>{answer.answer || '-'}</dd>
                    </div>
                  ))}
                </dl>
                <button type='button' className='btn_text btn_remove' onClick={() => handleDelete(response)}>
                  응답 삭제
                </button>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
