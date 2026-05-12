import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { image, mediaType } = await request.json()

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType || 'image/jpeg',
              data: image,
            },
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
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse nutrition data' }, { status: 500 })
  }

  const nutrition = JSON.parse(jsonMatch[0])
  return NextResponse.json(nutrition)
}
