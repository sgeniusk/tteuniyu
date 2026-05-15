// /api/v1/digest-prefs/unsubscribe?token=... — 정통망법 §50 1-click 수신거부
//
// 이메일 footer 또는 List-Unsubscribe header에서 호출. 인증 X (token 자체가 인증).

import { NextResponse } from 'next/server'

import { unsubscribeByToken } from '@/lib/digest-prefs/store'

export const dynamic = 'force-dynamic'

function htmlResponse(message: string, ok: boolean): Response {
  const color = ok ? '#14b8a6' : '#dc2626'
  return new Response(
    `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>뜬 이유 — 수신거부</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
  <style>
    body { margin: 0; padding: 80px 24px; background: #020617; color: #f8fafc; font-family: 'Pretendard', sans-serif; text-align: center; }
    h1 { color: ${color}; font-size: 24px; }
    p { color: #94a3b8; font-size: 15px; }
    a { color: #14b8a6; }
  </style>
</head>
<body>
  <h1>${message}</h1>
  <p>뜬 이유 Daily Digest 발송이 즉시 중단됩니다.</p>
  <p><a href="https://tteuniyu.com">홈으로</a></p>
</body>
</html>`,
    {
      status: ok ? 200 : 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    },
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) return htmlResponse('잘못된 요청', false)

  const ok = unsubscribeByToken(token)
  return htmlResponse(ok ? '✅ 수신거부 완료' : '⚠ 만료되었거나 잘못된 token', ok)
}

export async function POST(request: Request) {
  // 정통망법 §50 List-Unsubscribe-Post (One-Click) 표준 — POST 버전도 동일하게.
  return GET(request)
}
