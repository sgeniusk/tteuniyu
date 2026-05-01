/**
 * Email templates + sender stub (T-W03 / P0w).
 *
 * P0w: console.log only (Resend not yet wired). Templates return
 * { subject, html, text } so the future sender swap is a one-liner.
 *
 * P0a: replace `sendEmail` body with `resend.emails.send({...})`.
 * Add unsubscribe link generation + 전자상거래법 disclaimer.
 *
 * Tone: warm/Korean for B2C/Creator, formal for B2B.
 */

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface SendResult {
  delivered: boolean
  provider: 'console-stub' | 'resend'
  messageId?: string
}

const FOUNDER_NOTIFY_TO = 'founder@tteuniyu.com'

const FOOTER_HTML = `
  <hr style="border:0;border-top:1px solid #1E293B;margin:24px 0" />
  <p style="font-size:12px;color:#94A3B8">
    이 메일은 뜬이유 출시 전 알림 신청에 따라 전송되었습니다.<br />
    수신을 원하지 않으시면 <a href="https://tteuniyu.com/unsubscribe">구독 취소</a>를 눌러주세요.<br />
    뜬이유 · 한국 언론의 실시간 이슈와 보도 분포를 5초에.
  </p>
`.trim()

export function proPreorderConfirmation(email: string, intentScore: number): RenderedEmail {
  const subject = '[뜬이유] Pro 출시 알림 신청이 접수됐습니다'
  const intentLine =
    intentScore >= 4
      ? '강한 가입 의향(4점 이상)을 표시해주셔서 감사합니다 — 출시 직전 70% 우선 할인 코드를 가장 먼저 보내드립니다.'
      : '관심 표시 감사합니다. 가격·기능 결정 전 의견을 다시 여쭙겠습니다.'

  const html = `
    <div style="font-family:'Pretendard',system-ui,sans-serif;color:#F8FAFC;background:#0A0E1A;padding:24px">
      <h1 style="font-size:20px;color:#F8FAFC">Pro 출시 알림 신청 완료</h1>
      <p>안녕하세요, ${email}님.</p>
      <p>${intentLine}</p>
      <p>P0w 단계에서는 모든 기능이 출시 예정 상태입니다. 진행 상황은 알림으로만 발송됩니다.</p>
      ${FOOTER_HTML}
    </div>
  `.trim()

  const text = `Pro 출시 알림 신청 완료\n\n안녕하세요 ${email}님.\n${intentLine}\n\nP0w 단계에서는 모든 기능이 출시 예정 상태입니다.`

  return { subject, html, text }
}

export function creatorEmbedConfirmation(email: string, siteUrl: string): RenderedEmail {
  const subject = '[뜬이유] 크리에이터 Embed 얼리 액세스 신청 완료'
  const html = `
    <div style="font-family:'Pretendard',system-ui,sans-serif;color:#F8FAFC;background:#0A0E1A;padding:24px">
      <h1 style="font-size:20px">Embed 얼리 액세스 대기자 등록 완료</h1>
      <p>안녕하세요, ${email}님.</p>
      <p>등록하신 사이트: <a href="${siteUrl}" style="color:#14B8A6">${siteUrl}</a></p>
      <p>현재 P0w에서는 무료 무제한으로 Embed 사용 가능합니다.</p>
      <p>Creator Pro tier(월 ₩15,000~) 출시 시 가장 먼저 안내드립니다.</p>
      ${FOOTER_HTML}
    </div>
  `.trim()
  const text = `Embed 얼리 액세스 대기자 등록 완료\n\n사이트: ${siteUrl}\n현재 P0w에서 무료 무제한 사용 가능합니다.`
  return { subject, html, text }
}

export function b2bInquiryConfirmation(email: string, companyName: string): RenderedEmail {
  const subject = '[뜬이유] 기업·기관 문의가 접수되었습니다'
  const html = `
    <div style="font-family:'Pretendard',system-ui,sans-serif;color:#F8FAFC;background:#0A0E1A;padding:24px">
      <h1 style="font-size:20px">B2B 문의 접수 완료</h1>
      <p>${companyName} ${email}님,</p>
      <p>문의 주신 내용은 24시간 안에 회신드립니다.</p>
      <p>긴급 문의는 founder@tteuniyu.com 으로 직접 연락 부탁드립니다.</p>
      ${FOOTER_HTML}
    </div>
  `.trim()
  const text = `B2B 문의 접수 완료\n\n${companyName} ${email}님, 24시간 내 회신드리겠습니다.`
  return { subject, html, text }
}

export function b2bInquiryFounderNotification(input: {
  email: string
  company_name: string
  contact_name: string
  company_size: string
  use_case: string
  message: string
}): RenderedEmail {
  const subject = `[B2B 신규] ${input.company_name} (${input.use_case})`
  const text = `회사: ${input.company_name}\n담당: ${input.contact_name} <${input.email}>\n규모: ${input.company_size}\n용도: ${input.use_case}\n\n메시지:\n${input.message}`
  const html = `<pre style="font-family:Menlo,monospace;font-size:13px">${escapeHtml(text)}</pre>`
  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Sender stub. Logs to console in P0w; swap body for Resend in P0a.
 *
 * Returns SendResult so callers can pretend Resend is already there
 * — no API change when we swap providers.
 */
export async function sendEmail(to: string, rendered: RenderedEmail): Promise<SendResult> {
  // eslint-disable-next-line no-console
  console.log(
    `[email-stub] → ${to}\n  subject: ${rendered.subject}\n  text: ${rendered.text.slice(0, 240)}${rendered.text.length > 240 ? '…' : ''}`,
  )
  return { delivered: true, provider: 'console-stub', messageId: `stub-${Date.now()}` }
}

export const FOUNDER_EMAIL = FOUNDER_NOTIFY_TO
