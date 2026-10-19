import { useEffect, useState } from 'react'
import { subscribeInquiryList } from '../../services/inquiryService'
import BaseButton from '../common/BaseButton'
import AdminInquiryList from './AdminInquiryList'
import AdminInquiryDetail from './AdminInquiryDetail'
import type { IInquiry } from '../../types/inquiry'

interface IAdminInquirySectionProps {
  inquiry_id: string
  navigateTo: (path: string) => void
}

// 문의 관리: /admin 은 목록, /admin/inquiries/문의번호 는 상세
export default function AdminInquirySection({ inquiry_id, navigateTo }: IAdminInquirySectionProps) {
  const [inquiry_list, setInquiryList] = useState<IInquiry[]>([])
  const [is_list_loaded, setIsListLoaded] = useState<boolean>(false)
  const [error_message, setErrorMessage] = useState<string>('')

  useEffect(() => {
    return subscribeInquiryList(
      (next_list) => {
        setInquiryList(next_list)
        setIsListLoaded(true)
      },
      () => setErrorMessage('문의 내용을 불러올 수 없어요. 관리자 계정이 맞는지 확인해 주세요.'),
    )
  }, [])

  const goList = () => navigateTo('/admin')

  if (error_message) return <p className='txt_error'>{error_message}</p>
  if (!inquiry_id) return <AdminInquiryList inquiry_list={inquiry_list} onSelect={(selected_id) => navigateTo(`/admin/inquiries/${selected_id}`)} />
  if (!is_list_loaded) return null

  const selected_inquiry = inquiry_list.find((inquiry) => inquiry.id === inquiry_id)
  if (!selected_inquiry) {
    return (
      <>
        <p className='nodata'>문의를 찾을 수 없어요. 삭제되었을 수 있어요.</p>
        <div className='bx_detail_top'>
          <BaseButton modifier='list' onClick={goList}>
            목록
          </BaseButton>
        </div>
      </>
    )
  }
  return <AdminInquiryDetail key={selected_inquiry.id} inquiry={selected_inquiry} onBack={goList} />
}
