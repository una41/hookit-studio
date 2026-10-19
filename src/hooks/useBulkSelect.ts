import { useState } from 'react'

// 목록에서 체크박스로 여러 건을 고르는 기능 (문의 목록, 설문 응답 목록에서 같이 사용)
export const useBulkSelect = (all_id_list: string[]) => {
  const [checked_id_list, setCheckedIdList] = useState<string[]>([])

  // 다른 곳에서 삭제되어 목록에서 사라진 항목은 선택에서 제외
  const existing_id_set = new Set(all_id_list)
  const selected_id_list = checked_id_list.filter((checked_id) => existing_id_set.has(checked_id))
  const selected_id_set = new Set(selected_id_list)

  const toggle = (target_id: string) => {
    setCheckedIdList((current_list) => (current_list.includes(target_id) ? current_list.filter((checked_id) => checked_id !== target_id) : [...current_list, target_id]))
  }

  // 한 묶음(현재 페이지 등)을 한 번에 선택하거나 해제
  const setGroupChecked = (group_id_list: string[], is_checked: boolean) => {
    setCheckedIdList((current_list) => {
      const rest_list = current_list.filter((checked_id) => !group_id_list.includes(checked_id))
      return is_checked ? [...rest_list, ...group_id_list] : rest_list
    })
  }

  const clear = () => setCheckedIdList([])

  return { selected_id_list, selected_id_set, toggle, setGroupChecked, clear }
}
