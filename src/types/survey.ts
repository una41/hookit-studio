export type TSurveyQuestionType = 'short' | 'long' | 'choice'

export interface ISurveyQuestion {
  id: string
  label: string
  type: TSurveyQuestionType
  // 객관식일 때만 사용
  options: string[]
  required: boolean
}

// 관리자가 만드는 설문 내용
export interface ISurveyInput {
  title: string
  description: string
  questions: ISurveyQuestion[]
  isActive: boolean
}

export interface ISurvey extends ISurveyInput {
  id: string
  createdAt: Date | null
}

// 질문 문구를 응답에 함께 저장해서, 나중에 설문을 고쳐도 응답 내용이 그대로 읽힘
export interface ISurveyAnswer {
  question: string
  answer: string
}

export interface ISurveyResponse {
  id: string
  surveyId: string
  surveyTitle: string
  email: string
  answers: ISurveyAnswer[]
  createdAt: Date | null
}
