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

  const { ingredients, name } = await request.json()
  if (!ingredients?.length) return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const ingredientList = ingredients.map((i: { name: string; amount: string }) => `- ${i.amount} ${i.name}`).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Calculate the total nutritional content for this recipe/meal made with these ingredients:

${name ? `Name: ${name}` : ''}
Ingredients:
${ingredientList}

Add up the nutrition from all ingredients and return ONLY a JSON object (no markdown):
{
  "foodName": "${name || 'Custom Recipe'}",
  "servingSize": "full recipe (X servings estimated)",
  "calories": <total number>,
  "protein": <total grams>,
  "carbs": <total grams>,
  "fat": <total grams>,
  "fiber": <total grams>,
  "sugar": <total grams>,
  "confidence": "high" | "medium" | "low",
  "notes": "brief note about the estimate"
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Could not parse nutrition data' }, { status: 500 })

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
