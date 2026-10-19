import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { DocumentData, Timestamp } from 'firebase/firestore'
import { getFirestoreDatabase } from '../firebase'
import { deleteDocumentList } from './batchDelete'
import { withTimeout } from './withTimeout'
import type { ISurvey, ISurveyAnswer, ISurveyInput, ISurveyResponse } from '../types/survey'

const SURVEY_COLLECTION = 'surveys'
const RESPONSE_COLLECTION = 'surveyResponses'

const toDate = (value: unknown): Date | null => (value ? (value as Timestamp).toDate() : null)

const toSurvey = (survey_id: string, data: DocumentData): ISurvey => ({
  id: survey_id,
  title: data.title,
  description: data.description,
  questions: data.questions,
  isActive: data.isActive,
  createdAt: toDate(data.createdAt),
})

// 관리자: 설문 목록을 최신순으로 실시간 구독
export const subscribeSurveyList = (onChange: (survey_list: ISurvey[]) => void, onError: (error: Error) => void) => {
  const survey_query = query(collection(getFirestoreDatabase(), SURVEY_COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(survey_query, (snapshot) => onChange(snapshot.docs.map((survey_doc) => toSurvey(survey_doc.id, survey_doc.data()))), onError)
}

// 관리자: 모든 설문의 응답을 최신순으로 실시간 구독
// ponytail: 전체를 한 번에 구독(수천 건까지). 그 이상이면 설문별 쿼리와 페이징으로 교체
export const subscribeSurveyResponseList = (onChange: (response_list: ISurveyResponse[]) => void, onError: (error: Error) => void) => {
  const response_query = query(collection(getFirestoreDatabase(), RESPONSE_COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(
    response_query,
    (snapshot) =>
      onChange(
        snapshot.docs.map((response_doc) => {
          const data = response_doc.data()
          return {
            id: response_doc.id,
            surveyId: data.surveyId,
            surveyTitle: data.surveyTitle,
            email: data.email,
            answers: data.answers,
            createdAt: toDate(data.createdAt),
          }
        }),
      ),
    onError,
  )
}

// 관리자: 설문 만들기, 새 설문의 id를 반환
export const createSurvey = async (input: ISurveyInput): Promise<string> => {
  const created_doc = await addDoc(collection(getFirestoreDatabase(), SURVEY_COLLECTION), { ...input, createdAt: serverTimestamp() })
  return created_doc.id
}

export const updateSurvey = async (survey_id: string, input: ISurveyInput): Promise<void> => {
  await updateDoc(doc(getFirestoreDatabase(), SURVEY_COLLECTION, survey_id), { ...input })
}

export const deleteSurvey = async (survey_id: string): Promise<void> => {
  await deleteDoc(doc(getFirestoreDatabase(), SURVEY_COLLECTION, survey_id))
}

export const deleteSurveyResponse = async (response_id: string): Promise<void> => {
  await deleteDoc(doc(getFirestoreDatabase(), RESPONSE_COLLECTION, response_id))
}

// 관리자: 선택한 응답 여러 건 삭제
export const deleteSurveyResponseList = (response_id_list: string[]): Promise<void> => deleteDocumentList(RESPONSE_COLLECTION, response_id_list)

// 방문자: 공개 중인 설문 한 건 읽기 (없거나 비공개면 null)
export const getPublicSurvey = async (survey_id: string): Promise<ISurvey | null> => {
  try {
    const survey_doc = await getDoc(doc(getFirestoreDatabase(), SURVEY_COLLECTION, survey_id))
    return survey_doc.exists() ? toSurvey(survey_doc.id, survey_doc.data()) : null
  } catch {
    return null
  }
}

// 방문자: 설문 응답 저장 (firestore.rules의 검증 형식과 같아야 함)
export const submitSurveyResponse = async (survey: ISurvey, email: string, answers: ISurveyAnswer[]): Promise<void> => {
  const save_promise = addDoc(collection(getFirestoreDatabase(), RESPONSE_COLLECTION), {
    surveyId: survey.id,
    surveyTitle: survey.title,
    email,
    answers,
    createdAt: serverTimestamp(),
  })
  await withTimeout(save_promise, '설문 저장 시간 초과')
}
