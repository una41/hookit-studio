import type { TInquiryStatus } from '../types/inquiry'

export const STATUS_OPTION_LIST: { value: TInquiryStatus; label: string }[] = [
  { value: 'new', label: '신규' },
  { value: 'progress', label: '상담 중' },
  { value: 'contract', label: '계약' },
  { value: 'hold', label: '보류' },
  { value: 'closed', label: '종료' },
]

export const STATUS_LABEL_MAP: Record<TInquiryStatus, string> = {
  new: '신규',
  progress: '상담 중',
  contract: '계약',
  hold: '보류',
  closed: '종료',
}
