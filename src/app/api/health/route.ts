import { NextResponse } from 'next/server'

export async function GET() {
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'POSTHI_ENCRYPTION_KEY',
    'CRON_SECRET',
  ]

  const missingEnv = requiredEnv.filter((key) => !process.env[key])

  return NextResponse.json(
    {
      status: missingEnv.length === 0 ? 'ok' : 'degraded',
      service: 'posthi',
      timestamp: new Date().toISOString(),
      checks: {
        env: missingEnv.length === 0 ? 'ok' : 'missing',
      },
      ...(process.env.NODE_ENV !== 'production' ? { missingEnv } : {}),
    },
    { status: missingEnv.length === 0 ? 200 : 503 }
  )
}
