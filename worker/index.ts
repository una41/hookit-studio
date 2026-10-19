interface IEnv {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_CHAT_ID: string
  ALLOWED_ORIGIN_LIST: string
}

interface INotifyBody {
  job?: unknown
  name?: unknown
  phone?: unknown
  account?: unknown
  message?: unknown
}

// 필드별 최대 길이 (firestore.rules의 검증 길이와 맞춤)
const MAX_LENGTH_MAP: Record<string, number> = { job: 60, name: 50, phone: 30, account: 200, message: 2000 }

const toText = (value: unknown, field_name: string): string =>
  typeof value === 'string' ? value.trim().slice(0, MAX_LENGTH_MAP[field_name]) : ''

export default {
  async fetch(request: Request, env: IEnv): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const is_allowed = env.ALLOWED_ORIGIN_LIST.split(',').includes(origin)
    const cors_header = { 'Access-Control-Allow-Origin': is_allowed ? origin : '', 'Access-Control-Allow-Headers': 'Content-Type' }

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors_header })
    if (request.method !== 'POST' || !is_allowed) return new Response('forbidden', { status: 403 })

    const body = (await request.json().catch(() => ({}))) as INotifyBody
    const name = toText(body.name, 'name')
    const phone = toText(body.phone, 'phone')
    if (!name || !phone) return new Response('invalid', { status: 400, headers: cors_header })

    const text = [
      '[HOOKIT] 새 상담 신청',
      `직업: ${toText(body.job, 'job') || '-'}`,
      `성함: ${name}`,
      `연락처: ${phone}`,
      `운영 계정: ${toText(body.account, 'account') || '-'}`,
      `문의 내용: ${toText(body.message, 'message') || '-'}`,
    ].join('\n')

    const telegram_response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
    })
    return new Response(null, { status: telegram_response.ok ? 204 : 502, headers: cors_header })
  },
}
