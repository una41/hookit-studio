import { doc, writeBatch } from 'firebase/firestore'
import { getFirestoreDatabase } from '../firebase'

// Firestore는 한 번에 500건까지만 묶어서 처리할 수 있음
const BATCH_LIMIT = 500

// 선택한 문서들을 한 번에 삭제 (하나라도 실패하면 그 묶음은 전부 취소됨)
export const deleteDocumentList = async (collection_name: string, id_list: string[]): Promise<void> => {
  const database = getFirestoreDatabase()
  for (let start_index = 0; start_index < id_list.length; start_index += BATCH_LIMIT) {
    const batch = writeBatch(database)
    id_list.slice(start_index, start_index + BATCH_LIMIT).forEach((document_id) => batch.delete(doc(database, collection_name, document_id)))
    await batch.commit()
  }
}
