import BaseButton from '../common/BaseButton'
import type { ISurvey, ISurveyResponse } from '../../types/survey'

interface IAdminSurveyListProps {
  survey_list: ISurvey[]
  response_list: ISurveyResponse[]
  onSelect: (survey_id: string) => void
}

const formatDate = (date: Date | null): string =>
  date ? date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'

// 설문 목록: 행을 누르면 편집과 응답 보기로 이동
export default function AdminSurveyList({ survey_list, response_list, onSelect }: IAdminSurveyListProps) {
  return (
    <>
      <div className='bx_page_head'>
        <strong className='tit_page'>설문 관리</strong>
        <BaseButton onClick={() => onSelect('new')}>새 설문 만들기</BaseButton>
      </div>
      {survey_list.length === 0 ? (
        <p className='nodata'>만든 설문이 없어요. 새 설문을 만들어 보세요.</p>
      ) : (
        <div className='bx_tbl_scroll'>
          <table className='tbl_inquiry'>
            <thead>
              <tr>
                <th>제목</th>
                <th className='col_status'>상태</th>
                <th className='col_num'>응답</th>
                <th className='col_date'>만든 날짜</th>
              </tr>
            </thead>
            <tbody>
              {survey_list.map((survey) => (
                <tr key={survey.id} onClick={() => onSelect(survey.id)}>
                  <td>
                    <a href={`/admin/surveys/${survey.id}`} className='link_inquiry' onClick={(event) => event.preventDefault()}>
                      {survey.title}
                    </a>
                  </td>
                  <td className='col_status'>
                    <span className={survey.isActive ? 'txt_status contract' : 'txt_status'}>{survey.isActive ? '공개 중' : '비공개'}</span>
                  </td>
                  <td className='col_num'>{response_list.filter((response) => response.surveyId === survey.id).length}</td>
                  <td className='col_date'>{formatDate(survey.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
