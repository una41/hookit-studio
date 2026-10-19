import { useState } from 'react'
import { STATUS_LABEL_MAP, STATUS_OPTION_LIST } from '../../constants/inquiryStatus'
import { useBulkSelect } from '../../hooks/useBulkSelect'
import { deleteInquiryList } from '../../services/inquiryService'
import type { IInquiry, TInquiryStatus } from '../../types/inquiry'

interface IAdminInquiryListProps {
  inquiry_list: IInquiry[]
  onSelect: (inquiry_id: string) => void
}

type TStatusFilter = TInquiryStatus | 'all'

const PAGE_SIZE = 20

const formatDate = (date: Date | null): string =>
  date
    ? date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '-'

// 게시판 형태의 문의 목록: 상태 필터, 20건씩 페이지 나눔, 행을 누르면 상세로 이동
// ponytail: 전체를 한 번에 구독한 뒤 화면에서 나눔(수천 건까지). 그 이상이면 Firestore 쿼리 페이징으로 교체
export default function AdminInquiryList({ inquiry_list, onSelect }: IAdminInquiryListProps) {
  const [status_filter, setStatusFilter] = useState<TStatusFilter>('all')
  const [page_number, setPageNumber] = useState<number>(1)
  const [is_deleting, setIsDeleting] = useState<boolean>(false)
  const [error_message, setErrorMessage] = useState<string>('')
  const { selected_id_list, selected_id_set, toggle, setGroupChecked, clear } = useBulkSelect(inquiry_list.map((inquiry) => inquiry.id))

  const filtered_list = status_filter === 'all' ? inquiry_list : inquiry_list.filter((inquiry) => inquiry.status === status_filter)
  const total_page = Math.max(1, Math.ceil(filtered_list.length / PAGE_SIZE))
  const current_page = Math.min(page_number, total_page)
  const page_start = (current_page - 1) * PAGE_SIZE
  const page_list = filtered_list.slice(page_start, page_start + PAGE_SIZE)

  const is_page_all_selected = page_list.length > 0 && page_list.every((inquiry) => selected_id_set.has(inquiry.id))

  const handleFilter = (filter_value: TStatusFilter) => {
    setStatusFilter(filter_value)
    setPageNumber(1)
  }

  // 선택한 문의를 한 번에 삭제 (되돌릴 수 없으므로 한 번 더 확인)
  const handleBulkDelete = async () => {
    if (!window.confirm(`선택한 ${selected_id_list.length}건을 삭제할까요? 되돌릴 수 없어요.`)) return
    setIsDeleting(true)
    setErrorMessage('')
    try {
      await deleteInquiryList(selected_id_list)
      clear()
    } catch {
      setErrorMessage('삭제에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className='list_filter'>
        {[{ value: 'all', label: '전체' }, ...STATUS_OPTION_LIST].map((filter_option) => (
          <button
            key={filter_option.value}
            type='button'
            className={status_filter === filter_option.value ? 'btn_filter active' : 'btn_filter'}
            onClick={() => handleFilter(filter_option.value as TStatusFilter)}
          >
            {filter_option.label}
            <span className='num'>
              {filter_option.value === 'all'
                ? inquiry_list.length
                : inquiry_list.filter((inquiry) => inquiry.status === filter_option.value).length}
            </span>
          </button>
        ))}
      </div>
      {selected_id_list.length > 0 && (
        <div className='bx_bulk_bar'>
          <span className='txt_bulk'>{selected_id_list.length}건 선택됨</span>
          <button type='button' className='btn_text btn_remove' disabled={is_deleting} onClick={handleBulkDelete}>
            선택 삭제
          </button>
        </div>
      )}
      {error_message && <p className='txt_error'>{error_message}</p>}
      {filtered_list.length === 0 ? (
        <p className='nodata'>문의가 없어요.</p>
      ) : (
        <div className='bx_tbl_scroll'>
          <table className='tbl_inquiry'>
            <thead>
              <tr>
                <th className='col_check'>
                  <input
                    type='checkbox'
                    aria-label='현재 페이지 전체 선택'
                    checked={is_page_all_selected}
                    onChange={(event) => setGroupChecked(page_list.map((inquiry) => inquiry.id), event.target.checked)}
                  />
                </th>
                <th className='col_num'>번호</th>
                <th className='col_status'>상태</th>
                <th>이름</th>
                <th className='col_job'>직업</th>
                <th className='col_phone'>연락처</th>
                <th className='col_date'>접수일시</th>
              </tr>
            </thead>
            <tbody>
              {page_list.map((inquiry, page_index) => (
                <tr key={inquiry.id} onClick={() => onSelect(inquiry.id)}>
                  <td className='col_check' onClick={(event) => event.stopPropagation()}>
                    <input type='checkbox' aria-label={`${inquiry.name} 선택`} checked={selected_id_set.has(inquiry.id)} onChange={() => toggle(inquiry.id)} />
                  </td>
                  <td className='col_num'>{filtered_list.length - page_start - page_index}</td>
                  <td className='col_status'>
                    <span className={`txt_status ${inquiry.status}`}>{STATUS_LABEL_MAP[inquiry.status]}</span>
                  </td>
                  <td>
                    <a href={`/admin/inquiries/${inquiry.id}`} className='link_inquiry' onClick={(event) => event.preventDefault()}>
                      {inquiry.name}
                    </a>
                  </td>
                  <td className='col_job'>{inquiry.job}</td>
                  <td className='col_phone'>{inquiry.phone}</td>
                  <td className='col_date'>{formatDate(inquiry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total_page > 1 && (
        <div className='bx_paging'>
          <button type='button' className='btn_page' disabled={current_page === 1} onClick={() => setPageNumber(current_page - 1)}>
            이전
          </button>
          <span className='txt_page'>
            {current_page} / {total_page}
          </span>
          <button type='button' className='btn_page' disabled={current_page === total_page} onClick={() => setPageNumber(current_page + 1)}>
            다음
          </button>
        </div>
      )}
    </>
  )
}
