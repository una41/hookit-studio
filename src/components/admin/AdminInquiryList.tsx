import { useState } from 'react'
import AdminInquiryItem, { STATUS_OPTION_LIST } from './AdminInquiryItem'
import type { IInquiry, TInquiryStatus } from '../../types/inquiry'

interface IAdminInquiryListProps {
  inquiry_list: IInquiry[]
}

type TStatusFilter = TInquiryStatus | 'all'

export default function AdminInquiryList({ inquiry_list }: IAdminInquiryListProps) {
  const [status_filter, setStatusFilter] = useState<TStatusFilter>('all')

  const filtered_list = status_filter === 'all' ? inquiry_list : inquiry_list.filter((inquiry) => inquiry.status === status_filter)

  return (
    <>
      <div className='list_filter'>
        {[{ value: 'all', label: '전체' }, ...STATUS_OPTION_LIST].map((filter_option) => (
          <button
            key={filter_option.value}
            type='button'
            className={status_filter === filter_option.value ? 'btn_filter active' : 'btn_filter'}
            onClick={() => setStatusFilter(filter_option.value as TStatusFilter)}
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
      {filtered_list.length === 0 ? (
        <p className='nodata'>문의가 없어요.</p>
      ) : (
        <ul className='list_inquiry'>
          {filtered_list.map((inquiry) => (
            <AdminInquiryItem key={inquiry.id} inquiry={inquiry} />
          ))}
        </ul>
      )}
    </>
  )
}
