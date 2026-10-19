import { useState } from 'react'
import BaseButton from '../common/BaseButton'
import BaseModal from '../common/BaseModal'
import { createSurvey, deleteSurvey, updateSurvey } from '../../services/surveyService'
import type { ISurvey, ISurveyInput, ISurveyQuestion, TSurveyQuestionType } from '../../types/survey'

interface IAdminSurveyEditorProps {
  survey: ISurvey | null
  response_count: number
  onSaved: () => void
  onDeleted: () => void
}

// 입력 중인 질문: 객관식 보기는 줄바꿈으로 구분한 글로 편집
interface IQuestionDraft {
  id: string
  label: string
  type: TSurveyQuestionType
  option_text: string
  required: boolean
}

const QUESTION_TYPE_LIST: { value: TSurveyQuestionType; label: string }[] = [
  { value: 'short', label: '짧은 답' },
  { value: 'long', label: '긴 답' },
  { value: 'choice', label: '객관식' },
]

const createQuestionDraft = (label = '', type: TSurveyQuestionType = 'short', option_text = ''): IQuestionDraft => ({
  id: crypto.randomUUID(),
  label,
  type,
  option_text,
  required: false,
})

// 새 설문의 임시 질문 (관리자가 바로 고쳐서 사용)
const createTemplateQuestionList = (): IQuestionDraft[] => [
  createQuestionDraft('직업이 무엇인가요?', 'choice', '변호사\n의사\n세무사\n기타'),
  createQuestionDraft('운영 중인 채널이 있나요? (인스타그램 계정 등)'),
  createQuestionDraft('가장 큰 고민은 무엇인가요?', 'long'),
]

const toQuestionDraftList = (question_list: ISurveyQuestion[]): IQuestionDraft[] =>
  question_list.map((question) => ({
    id: question.id,
    label: question.label,
    type: question.type,
    option_text: question.options.join('\n'),
    required: question.required,
  }))

// 설문 만들기와 수정: 제목, 설명, 공개 여부, 질문 목록
export default function AdminSurveyEditor({ survey, response_count, onSaved, onDeleted }: IAdminSurveyEditorProps) {
  const [title, setTitle] = useState<string>(survey?.title ?? '')
  const [description, setDescription] = useState<string>(survey?.description ?? '')
  const [is_active, setIsActive] = useState<boolean>(survey?.isActive ?? true)
  const [question_draft_list, setQuestionDraftList] = useState<IQuestionDraft[]>(() =>
    survey ? toQuestionDraftList(survey.questions) : createTemplateQuestionList(),
  )
  const [is_working, setIsWorking] = useState<boolean>(false)
  const [notice_text, setNoticeText] = useState<string>('')
  const [is_error, setIsError] = useState<boolean>(false)
  const [is_saved_modal_open, setIsSavedModalOpen] = useState<boolean>(false)

  const survey_link = survey ? `${window.location.origin}/survey/${survey.id}` : ''

  const showNotice = (text: string, error: boolean) => {
    setNoticeText(text)
    setIsError(error)
  }

  const updateQuestion = (question_id: string, changes: Partial<IQuestionDraft>) => {
    setQuestionDraftList((current_list) => current_list.map((question) => (question.id === question_id ? { ...question, ...changes } : question)))
  }

  const removeQuestion = (question_id: string) => {
    setQuestionDraftList((current_list) => current_list.filter((question) => question.id !== question_id))
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(survey_link)
      showNotice('설문 주소를 복사했어요.', false)
    } catch {
      showNotice('복사에 실패했어요. 주소를 직접 선택해서 복사해 주세요.', true)
    }
  }

  // 입력 내용을 검사하고 저장용 형태로 바꿈 (문제가 있으면 null)
  const buildInput = (): ISurveyInput | null => {
    if (!title.trim()) {
      showNotice('설문 제목을 입력해 주세요.', true)
      return null
    }
    if (question_draft_list.length === 0) {
      showNotice('질문을 하나 이상 추가해 주세요.', true)
      return null
    }
    const question_list: ISurveyQuestion[] = []
    for (const [question_index, question] of question_draft_list.entries()) {
      const option_list = question.option_text
        .split('\n')
        .map((option) => option.trim())
        .filter(Boolean)
      if (!question.label.trim()) {
        showNotice(`${question_index + 1}번 질문의 내용을 입력해 주세요.`, true)
        return null
      }
      if (question.type === 'choice' && option_list.length < 2) {
        showNotice(`${question_index + 1}번 질문은 보기를 2개 이상 입력해 주세요.`, true)
        return null
      }
      question_list.push({
        id: question.id,
        label: question.label.trim(),
        type: question.type,
        options: question.type === 'choice' ? option_list : [],
        required: question.required,
      })
    }
    return { title: title.trim(), description: description.trim(), questions: question_list, isActive: is_active }
  }

  const handleSave = async () => {
    const input = buildInput()
    if (!input) return
    setIsWorking(true)
    showNotice('', false)
    try {
      if (survey) {
        await updateSurvey(survey.id, input)
      } else {
        await createSurvey(input)
      }
      setIsSavedModalOpen(true)
    } catch {
      showNotice('저장에 실패했어요. 다시 시도해 주세요.', true)
    } finally {
      setIsWorking(false)
    }
  }

  // 응답이 있는 설문은 지우면 응답을 볼 수 없게 되므로 삭제하지 못하게 막음 (비공개로 전환)
  const handleDelete = async () => {
    if (!survey) return
    if (response_count > 0) {
      showNotice('응답이 있는 설문은 삭제할 수 없어요. 공개를 꺼서 비공개로 바꿔 주세요.', true)
      return
    }
    if (!window.confirm('이 설문을 삭제할까요? 되돌릴 수 없어요.')) return
    setIsWorking(true)
    try {
      await deleteSurvey(survey.id)
      onDeleted()
    } catch {
      showNotice('삭제에 실패했어요. 다시 시도해 주세요.', true)
      setIsWorking(false)
    }
  }

  return (
    <div className='card_inquiry card_survey_editor'>
      <strong className='tit_page'>{survey ? '설문 수정' : '새 설문 만들기'}</strong>
      {survey && (
        <div className='bx_survey_link'>
          <span className='txt_field'>설문 주소</span>
          <input className='ipt_text' readOnly value={survey_link} onFocus={(event) => event.target.select()} />
          <BaseButton modifier='line' onClick={handleCopyLink}>
            복사
          </BaseButton>
        </div>
      )}
      <label className='lab_field'>
        <span className='txt_field'>설문 제목</span>
        <input className='ipt_text' value={title} onChange={(event) => setTitle(event.target.value)} placeholder='예) 릴스 대행 사전 설문' maxLength={100} />
      </label>
      <label className='lab_field'>
        <span className='txt_field'>안내 문구 (선택)</span>
        <textarea
          className='ipt_text'
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder='설문 맨 위에 보여줄 안내 문구를 적어 주세요.'
        />
      </label>
      <label className='lab_check'>
        <input type='checkbox' checked={is_active} onChange={(event) => setIsActive(event.target.checked)} />
        <span>공개 (끄면 방문자가 설문을 열 수 없어요)</span>
      </label>
      <ol className='list_question_editor'>
        {question_draft_list.map((question, question_index) => (
          <li key={question.id} className='item_question_editor'>
            <div className='bx_question_head'>
              <span className='num'>{question_index + 1}</span>
              <select
                className='sel_basic'
                value={question.type}
                onChange={(event) => updateQuestion(question.id, { type: event.target.value as TSurveyQuestionType })}
              >
                {QUESTION_TYPE_LIST.map((type_option) => (
                  <option key={type_option.value} value={type_option.value}>
                    {type_option.label}
                  </option>
                ))}
              </select>
              <label className='lab_check'>
                <input type='checkbox' checked={question.required} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} />
                <span>필수</span>
              </label>
              <button type='button' className='btn_text btn_remove' onClick={() => removeQuestion(question.id)}>
                삭제
              </button>
            </div>
            <input
              className='ipt_text'
              value={question.label}
              onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
              placeholder='질문 내용'
              maxLength={200}
            />
            {question.type === 'choice' && (
              <textarea
                className='ipt_text'
                rows={4}
                value={question.option_text}
                onChange={(event) => updateQuestion(question.id, { option_text: event.target.value })}
                placeholder={'보기를 한 줄에 하나씩 적어 주세요.\n예)\n변호사\n의사'}
              />
            )}
          </li>
        ))}
      </ol>
      <BaseButton modifier='line' onClick={() => setQuestionDraftList((current_list) => [...current_list, createQuestionDraft()])}>
        + 질문 추가
      </BaseButton>
      <div className='bx_inquiry_action'>
        <p className={is_error ? 'txt_notice txt_error' : 'txt_notice'}>{notice_text}</p>
        {survey && (
          <BaseButton modifier='line danger' disabled={is_working} onClick={handleDelete}>
            삭제
          </BaseButton>
        )}
        <BaseButton disabled={is_working} onClick={handleSave}>
          저장
        </BaseButton>
      </div>
      {is_saved_modal_open && <BaseModal onConfirm={onSaved}>저장되었습니다.</BaseModal>}
    </div>
  )
}
