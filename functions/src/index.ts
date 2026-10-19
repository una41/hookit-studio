import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'

const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_ID = defineSecret('TELEGRAM_CHAT_ID')

// 새 문의가 저장되면 텔레그램으로 알림 전송 (봇 토큰은 서버에만 보관)
export const notifyInquiry = onDocumentCreated(
  { document: 'inquiries/{inquiryId}', secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID] },
  async (event) => {
    const inquiry = event.data?.data()
    if (!inquiry) return

    const message_text = [
      '📩 새 상담 문의가 들어왔어요',
      '',
      `직업: ${inquiry.job}`,
      `성함: ${inquiry.name}`,
      `연락처: ${inquiry.phone}`,
      `운영 계정: ${inquiry.account || '-'}`,
      `문의 내용: ${inquiry.message || '-'}`,
    ].join('\n')

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.value()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID.value(), text: message_text }),
    })
    if (!response.ok) {
      throw new Error(`텔레그램 전송 실패: ${response.status}`)
    }
  },
)
