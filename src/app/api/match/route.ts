import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getListings } from '@/lib/supabase'
import { algorithmicMatch } from '@/lib/matchListings'
import type { Person, MatchResult, Listing } from '@/types'

const STATE_ABBREVS: Record<string, string> = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
  'Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID',
  'Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA',
  'Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
  'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
  'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
  'Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
  'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
]

async function fetchRentCastListings(city: string, state: string, limit: number): Promise<Listing[]> {
  const apiKey = process.env.RENTCAST_API_KEY
  if (!apiKey) return []

  const stateAbbr = STATE_ABBREVS[state] || state

  try {
    const url = `https://api.rentcast.io/v1/listings/rental/long-term?city=${encodeURIComponent(city)}&state=${encodeURIComponent(stateAbbr)}&limit=${limit}`
    const response = await fetch(url, { headers: { 'X-Api-Key': apiKey } })

    if (!response.ok) return []
    const data = await response.json()
    if (!Array.isArray(data)) return []

    return data.slice(0, limit).map((item: any, idx: number) => ({
      id: item.id || `rc-${city}-${stateAbbr}-${idx}`,
      title: item.formattedAddress || item.addressLine1 || 'Rental Property',
      address: item.formattedAddress || '',
      neighborhood: item.county || city,
      city: item.city || city,
      price: item.price || 0,
      bedrooms: item.bedrooms || 1,
      bathrooms: item.bathrooms || 1,
      sqft: item.squareFootage || 1000,
      amenities: [],
      images: [FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]],
      description: `${item.propertyType || 'Rental'} in ${item.city || city}, ${item.state || stateAbbr}. Listed ${new Date(item.listedDate).toLocaleDateString()}.`,
      available: item.listedDate ? item.listedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      petFriendly: false,
      parking: false,
      laundry: 'none' as const,
      type: (item.propertyType?.toLowerCase().includes('house') ? 'house' :
             item.propertyType?.toLowerCase().includes('condo') ? 'condo' : 'apartment') as Listing['type'],
    }))
  } catch (error) {
    console.error(`Error fetching RentCast listings for ${city}, ${state}:`, error)
    return []
  }
}

export async function POST(request: NextRequest) {
  const { people }: { people: Person[] } = await request.json()

  // Fetch listings from RentCast for all selected states/cities
  const locations = [...new Set(
    people.map(p => ({ city: p.preferences.location, state: p.preferences.state }))
  )];

  let listings: any[] = [];
  for (const loc of locations) {
    const rentCastListings = await fetchRentCastListings(loc.city, loc.state, 20);
    listings.push(...rentCastListings);
  }

  // Remove duplicates by address
  listings = [...new Map(listings.map(l => [l.address, l])).values()];

  if (listings.length === 0) {
    // Fallback to Supabase if RentCast returns nothing
    listings = await getListings();
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    const results = algorithmicMatch(people, listings)
    return NextResponse.json({ results, usedAI: false })
  }

  try {
    const client = new Anthropic({ apiKey })

    const totalBudget = people.reduce((sum, p) => sum + p.budget, 0)
    const avgBedrooms = Math.ceil(
      people.reduce((sum, p) => sum + p.preferences.bedrooms, 0) / people.length
    )
    const allAmenities = people.flatMap(p => p.preferences.amenities)
    const amenityFrequency: Record<string, number> = {}
    for (const a of allAmenities) amenityFrequency[a] = (amenityFrequency[a] || 0) + 1
    const priorityAmenities = Object.entries(amenityFrequency)
      .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([a]) => a)
    const mustHaves = [...new Set(people.flatMap(p => p.preferences.mustHave))]
    const dealBreakers = [...new Set(people.flatMap(p => p.preferences.dealBreakers))]
    const preferredLocations = [...new Set(
      people.map(p => p.preferences.location).filter(l => l && l !== 'Anywhere')
    )]

    const groupProfile = {
      memberCount: people.length,
      memberNames: people.map(p => p.name),
      totalBudget,
      perPersonBudgets: people.map(p => ({ name: p.name, budget: p.budget })),
      bedroomsNeeded: avgBedrooms,
      preferredLocations,
      priorityAmenities,
      mustHaves,
      dealBreakers,
    }

    const listingsSummary = listings.map(l => ({
      id: l.id,
      title: l.title,
      neighborhood: l.neighborhood,
      city: l.city,
      price: l.price,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      sqft: l.sqft,
      amenities: l.amenities,
      petFriendly: l.petFriendly,
      parking: l.parking,
      laundry: l.laundry,
      type: l.type,
    }))

    const prompt = `You are a smart rental matching assistant. Rank the TOP 6 best listings for this group and explain why.

GROUP PROFILE:
${JSON.stringify(groupProfile, null, 2)}

AVAILABLE LISTINGS:
${JSON.stringify(listingsSummary, null, 2)}

Score each listing against the group's needs. Consider:
1. Price fits combined budget ($${totalBudget}/mo)
2. Location matches preferences
3. Bedrooms meet group needs (target: ${avgBedrooms}+)
4. Amenities match priority list
5. Must-haves present, no deal-breakers

Return a JSON array of the top 6 in this exact format:
[
  {
    "listingId": "string",
    "score": number (0-100),
    "matchSummary": "2-3 sentence summary for this specific group",
    "pros": ["3-5 specific pros"],
    "cons": ["1-3 honest cons"]
  }
]

Return ONLY the JSON array, no other text.`

    const response = await (client.messages.create as Function)({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlock = (response as any).content.find((b: any) => b.type === 'text')
    if (!textBlock) throw new Error('No text in response')

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const rankings: Array<{
      listingId: string
      score: number
      matchSummary: string
      pros: string[]
      cons: string[]
    }> = JSON.parse(jsonMatch[0])

    const results: MatchResult[] = rankings
      .map(rank => {
        const listing = listings.find(l => l.id === rank.listingId)
        if (!listing) return null
        return {
          listing,
          score: rank.score,
          matchSummary: rank.matchSummary,
          perPersonBudgetShare: Math.ceil(listing.price / people.length),
          pros: rank.pros,
          cons: rank.cons,
        }
      })
      .filter((r): r is MatchResult => r !== null)
      .sort((a, b) => b.score - a.score)

    return NextResponse.json({ results, usedAI: true })
  } catch (err) {
    console.error('Claude matching error:', err)
    const results = algorithmicMatch(people, listings)
    return NextResponse.json({
      results,
      usedAI: false,
      error: err instanceof Error ? err.message : 'AI matching failed',
    })
  }
}
