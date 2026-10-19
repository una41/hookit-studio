import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { getFirestoreDatabase } from '../firebase'
import type { IInquiry, IInquiryInput, TInquiryStatus } from '../types/inquiry'

const INQUIRY_COLLECTION = 'inquiries'
const SUBMIT_TIMEOUT_MILLISECOND = 10000

// 방문자 문의 저장 (firestore.rules의 검증 형식과 같아야 함)
// Firestore는 연결이 안 되면 오류 없이 계속 대기하므로, 시간 안에 저장되지 않으면 실패로 처리
export const submitInquiry = async (input: IInquiryInput): Promise<void> => {
  const save_promise = addDoc(collection(getFirestoreDatabase(), INQUIRY_COLLECTION), {
    ...input,
    status: 'new',
    memo: '',
    createdAt: serverTimestamp(),
  })
  const timeout_promise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('문의 저장 시간 초과')), SUBMIT_TIMEOUT_MILLISECOND)
  })
  await Promise.race([save_promise, timeout_promise])
  notifyOwner(input)
}

// 저장이 끝난 문의를 텔레그램 알림 Worker로 보냄 (알림이 실패해도 문의 접수는 성공으로 처리)
const notifyOwner = (input: IInquiryInput): void => {
  const notify_url = import.meta.env.VITE_NOTIFY_URL
  if (!notify_url) return
  fetch(notify_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).catch(() => undefined)
}

// 관리자: 문의 목록을 최신순으로 실시간 구독, 해제 함수를 반환
export const subscribeInquiryList = (onChange: (inquiry_list: IInquiry[]) => void, onError: (error: Error) => void) => {
  const inquiry_query = query(collection(getFirestoreDatabase(), INQUIRY_COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(
    inquiry_query,
    (snapshot) => {
      onChange(
        snapshot.docs.map((inquiry_doc) => {
          const data = inquiry_doc.data()
          return {
            id: inquiry_doc.id,
            job: data.job,
            name: data.name,
            phone: data.phone,
            account: data.account,
            message: data.message,
            status: data.status,
            memo: data.memo,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : null,
          }
        }),
      )
    },
    onError,
  )
}

// 관리자: 상태 또는 메모 수정
export const updateInquiry = async (inquiry_id: string, changes: { status?: TInquiryStatus; memo?: string }): Promise<void> => {
  await updateDoc(doc(getFirestoreDatabase(), INQUIRY_COLLECTION, inquiry_id), changes)
}

// 관리자: 문의 삭제
export const deleteInquiry = async (inquiry_id: string): Promise<void> => {
  await deleteDoc(doc(getFirestoreDatabase(), INQUIRY_COLLECTION, inquiry_id))
}
