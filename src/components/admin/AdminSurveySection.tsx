import { useEffect, useState } from 'react'
import { subscribeSurveyList, subscribeSurveyResponseList } from '../../services/surveyService'
import BaseButton from '../common/BaseButton'
import AdminSurveyList from './AdminSurveyList'
import AdminSurveyEditor from './AdminSurveyEditor'
import AdminSurveyResponseList from './AdminSurveyResponseList'
import type { ISurvey, ISurveyResponse } from '../../types/survey'

interface IAdminSurveySectionProps {
  survey_id: string
  navigateTo: (path: string) => void
}

// 설문 관리: /admin/surveys 는 목록, /admin/surveys/new 는 새 설문, /admin/surveys/설문번호 는 편집과 응답 보기
export default function AdminSurveySection({ survey_id, navigateTo }: IAdminSurveySectionProps) {
  const [survey_list, setSurveyList] = useState<ISurvey[]>([])
  const [response_list, setResponseList] = useState<ISurveyResponse[]>([])
  const [is_list_loaded, setIsListLoaded] = useState<boolean>(false)
  const [error_message, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleError = () => setErrorMessage('설문 내용을 불러올 수 없어요. 관리자 계정이 맞는지 확인해 주세요.')
    const unsubscribe_survey = subscribeSurveyList((next_list) => {
      setSurveyList(next_list)
      setIsListLoaded(true)
    }, handleError)
    const unsubscribe_response = subscribeSurveyResponseList(setResponseList, handleError)
    return () => {
      unsubscribe_survey()
      unsubscribe_response()
    }
  }, [])

  const goList = () => navigateTo('/admin/surveys')

  const renderBackButton = () => (
    <div className='bx_detail_top'>
      <BaseButton modifier='list' onClick={goList}>
        목록
      </BaseButton>
    </div>
  )

  if (error_message) return <p className='txt_error'>{error_message}</p>
  if (!survey_id) {
    return <AdminSurveyList survey_list={survey_list} response_list={response_list} onSelect={(selected_id) => navigateTo(`/admin/surveys/${selected_id}`)} />
  }
  if (survey_id === 'new') {
    return (
      <>
        {renderBackButton()}
        <AdminSurveyEditor key='new' survey={null} response_count={0} onSaved={goList} onDeleted={goList} />
      </>
    )
  }
  if (!is_list_loaded) return null

  const selected_survey = survey_list.find((survey) => survey.id === survey_id)
  if (!selected_survey) {
    return (
      <>
        <p className='nodata'>설문을 찾을 수 없어요. 삭제되었을 수 있어요.</p>
        {renderBackButton()}
      </>
    )
  }

  const survey_response_list = response_list.filter((response) => response.surveyId === selected_survey.id)
  return (
    <>
      {renderBackButton()}
      <AdminSurveyEditor
        key={selected_survey.id}
        survey={selected_survey}
        response_count={survey_response_list.length}
        onSaved={goList}
        onDeleted={goList}
      />
      <AdminSurveyResponseList response_list={survey_response_list} />
    </>
  )
}
