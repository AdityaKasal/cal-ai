import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const OWNER_EMAIL = 'aditya.kasal@gmail.com'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the requester is the owner
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await anonClient.auth.getUser(token)
  if (error || !user || user.email !== OWNER_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use admin client to list all users
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers()
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })

  // Get total scans per user
  const { data: logs } = await adminClient
    .from('food_logs')
    .select('user_id, date_key')

  const scansByUser: Record<string, { total: number; today: number }> = {}
  const today = new Date().toLocaleDateString('en-CA')

  for (const log of logs ?? []) {
    if (!scansByUser[log.user_id]) scansByUser[log.user_id] = { total: 0, today: 0 }
    scansByUser[log.user_id].total++
    if (log.date_key === today) scansByUser[log.user_id].today++
  }

  const result = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || '—',
    joined: u.created_at,
    lastSeen: u.last_sign_in_at,
    totalScans: scansByUser[u.id]?.total ?? 0,
    todayScans: scansByUser[u.id]?.today ?? 0,
  }))

  return NextResponse.json(result)
}
