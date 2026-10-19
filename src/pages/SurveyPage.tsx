import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import BaseButton from '../components/common/BaseButton'
import { getPublicSurvey, submitSurveyResponse } from '../services/surveyService'
import type { ISurvey } from '../types/survey'

type TLoadState = 'loading' | 'ready' | 'missing'

// 설문 페이지 (/survey/설문번호): 이메일과 답변을 적어 제출하면 관리자 화면에서 볼 수 있음
export default function SurveyPage() {
  const survey_id = window.location.pathname.split('/')[2] ?? ''
  const [survey, setSurvey] = useState<ISurvey | null>(null)
  const [load_state, setLoadState] = useState<TLoadState>('loading')
  const [email, setEmail] = useState<string>('')
  const [answer_map, setAnswerMap] = useState<Record<string, string>>({})
  const [honeypot_text, setHoneypotText] = useState<string>('')
  const [is_submitting, setIsSubmitting] = useState<boolean>(false)
  const [is_done, setIsDone] = useState<boolean>(false)
  const [error_message, setErrorMessage] = useState<string>('')

  useEffect(() => {
    document.title = '설문 | HOOKIT STUDIO'
    // 설문은 받은 사람만 쓰는 페이지라 검색에 노출되지 않도록 설정 (index.html의 index 설정을 덮어씀)
    const robots_meta = document.querySelector('meta[name="robots"]')
    robots_meta?.setAttribute('content', 'noindex, nofollow')
    getPublicSurvey(survey_id).then((loaded_survey) => {
      setSurvey(loaded_survey)
      setLoadState(loaded_survey ? 'ready' : 'missing')
    })
  }, [survey_id])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!survey) return
    // 사람이 볼 수 없는 칸이 채워져 있으면 봇으로 보고 저장하지 않음
    if (honeypot_text) {
      setIsDone(true)
      return
    }
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const answers = survey.questions.map((question) => ({ question: question.label, answer: (answer_map[question.id] ?? '').trim() }))
      await submitSurveyResponse(survey, email.trim(), answers)
      setIsDone(true)
    } catch {
      setErrorMessage('제출에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderBody = () => {
    if (load_state === 'loading') return null
    if (load_state === 'missing' || !survey) {
      return (
        <div className='bx_survey_message'>
          <strong className='tit_message'>설문을 열 수 없어요</strong>
          <p className='txt_message'>주소가 올바르지 않거나, 지금은 받지 않는 설문이에요.</p>
        </div>
      )
    }
    if (is_done) {
      return (
        <div className='bx_survey_message'>
          <strong className='tit_message'>제출이 완료됐어요</strong>
          <p className='txt_message'>소중한 답변 감사합니다.</p>
        </div>
      )
    }
    return (
      <form className='form_survey' onSubmit={handleSubmit}>
        <h1 className='tit_survey'>{survey.title}</h1>
        {survey.description && <p className='txt_survey_desc'>{survey.description}</p>}
        <label className='lab_field'>
          <span className='txt_field'>
            이메일 <span className='txt_required'>*</span>
          </span>
          <input className='ipt_text' type='email' value={email} onChange={(event) => setEmail(event.target.value)} placeholder='example@email.com' required />
        </label>
        {survey.questions.map((question) => (
          <fieldset key={question.id} className='lab_field'>
            <legend className='txt_field'>
              {question.label} {question.required && <span className='txt_required'>*</span>}
            </legend>
            {question.type === 'short' && (
              <input
                className='ipt_text'
                value={answer_map[question.id] ?? ''}
                onChange={(event) => setAnswerMap({ ...answer_map, [question.id]: event.target.value })}
                required={question.required}
              />
            )}
            {question.type === 'long' && (
              <textarea
                className='ipt_text'
                rows={4}
                value={answer_map[question.id] ?? ''}
                onChange={(event) => setAnswerMap({ ...answer_map, [question.id]: event.target.value })}
                required={question.required}
              />
            )}
            {question.type === 'choice' && (
              <div className='list_choice'>
                {question.options.map((option) => (
                  <label key={option} className='lab_choice'>
                    <input
                      type='radio'
                      name={question.id}
                      value={option}
                      checked={answer_map[question.id] === option}
                      onChange={() => setAnswerMap({ ...answer_map, [question.id]: option })}
                      required={question.required}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ))}
        <input className='ipt_honeypot' name='website' tabIndex={-1} autoComplete='off' aria-hidden='true' value={honeypot_text} onChange={(event) => setHoneypotText(event.target.value)} />
        {error_message && <p className='txt_error'>{error_message}</p>}
        <BaseButton type='submit' modifier='full' disabled={is_submitting}>
          {is_submitting ? '제출 중…' : '제출하기'}
        </BaseButton>
      </form>
    )
  }

  return (
    <div className='bx_survey'>
      <div className='card_survey'>{renderBody()}</div>
    </div>
  )
}
