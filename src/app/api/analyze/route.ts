import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const OWNER_EMAIL = 'aditya.kasal@gmail.com'
const DAILY_LIMIT = 10

async function checkRateLimit(token: string): Promise<{ allowed: boolean; error?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return { allowed: false, error: 'Unauthorized' }
  if (user.email === OWNER_EMAIL) return { allowed: true }

  const today = new Date().toLocaleDateString('en-CA')
  const { count } = await supabase
    .from('food_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('date_key', today)

  if ((count ?? 0) >= DAILY_LIMIT) {
    return { allowed: false, error: `Daily limit of ${DAILY_LIMIT} scans reached. Come back tomorrow!` }
  }

  return { allowed: true }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, error: limitError } = await checkRateLimit(token)
  if (!allowed) return NextResponse.json({ error: limitError }, { status: 429 })

  const { image, mediaType } = await request.json()
  if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image },
          },
          {
            type: 'text',
            text: `Analyze this food image and estimate its nutritional content. Be specific about what you see.

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "foodName": "name of the food/meal",
  "servingSize": "estimated serving size (e.g. 1 cup, 200g, 1 slice)",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>,
  "sugar": <number in grams>,
  "confidence": "high" | "medium" | "low",
  "notes": "brief note about the estimate accuracy or what was identified"
}

Base your estimates on typical nutritional databases. If multiple foods are visible, treat it as one meal and sum the totals.`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Could not parse nutrition data' }, { status: 500 })

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
