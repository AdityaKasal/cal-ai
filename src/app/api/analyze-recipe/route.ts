import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { ingredients, name } = await request.json()

  if (!ingredients?.length) {
    return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const ingredientList = ingredients.map((i: { name: string; amount: string }) => `- ${i.amount} ${i.name}`).join('\n')

  const response = await client.messages.create({
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
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse nutrition data' }, { status: 500 })
  }

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
