export type TInquiryStatus = 'new' | 'progress' | 'contract' | 'hold'

// 방문자가 폼에 입력하는 값
export interface IInquiryInput {
  job: string
  name: string
  phone: string
  account: string
  message: string
}

// 저장된 문의 (관리자 페이지에서 사용)
export interface IInquiry extends IInquiryInput {
  id: string
  status: TInquiryStatus
  memo: string
  createdAt: Date | null
}
