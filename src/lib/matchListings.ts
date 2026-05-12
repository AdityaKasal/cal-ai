import { Person, Listing, MatchResult } from '@/types'

// Algorithmic fallback — used when Claude API is unavailable
export function algorithmicMatch(people: Person[], listings: Listing[]): MatchResult[] {
  const totalBudget = people.reduce((sum, p) => sum + p.budget, 0)
  const avgBedrooms = Math.ceil(
    people.reduce((sum, p) => sum + p.preferences.bedrooms, 0) / people.length
  )
  const allAmenities = people.flatMap(p => p.preferences.amenities)
  const amenitySet = new Set(allAmenities)
  const mustHaves = [...new Set(people.flatMap(p => p.preferences.mustHave))]
  const dealBreakers = [...new Set(people.flatMap(p => p.preferences.dealBreakers))]
  const preferredLocations = [...new Set(
    people.map(p => p.preferences.location.toLowerCase()).filter(l => l && l !== 'anywhere')
  )]

  // Filter out listings more than 50% over budget
  const affordable = listings.filter(l => l.price <= totalBudget * 1.5)
  const pool = affordable.length > 0 ? affordable : listings // fallback to all if nothing fits

  const scored = pool.map(listing => {
    let score = 60
    const pros: string[] = []
    const cons: string[] = []

    if (listing.price <= totalBudget) {
      score += 25
      const savings = totalBudget - listing.price
      if (savings > 0) pros.push(`$${savings}/mo under budget`)
    } else {
      const over = listing.price - totalBudget
      score -= Math.min(40, Math.floor((over / totalBudget) * 100))
      cons.push(`$${over}/mo over combined budget`)
    }

    if (listing.bedrooms >= avgBedrooms) {
      score += 10
      pros.push(`${listing.bedrooms} bedrooms fits the group`)
    } else {
      score -= 15
      cons.push(`Only ${listing.bedrooms} bedroom(s), group needs ${avgBedrooms}+`)
    }

    if (preferredLocations.length > 0) {
      const nbLower = listing.neighborhood.toLowerCase()
      const cityLower = listing.city.toLowerCase()
      const match = preferredLocations.some(
        loc => nbLower.includes(loc) || cityLower.includes(loc) || loc.includes(nbLower)
      )
      if (match) {
        score += 10
        pros.push(`In preferred neighborhood: ${listing.neighborhood}`)
      }
    }

    const matchedAmenities = listing.amenities.filter(a =>
      amenitySet.has(a) || allAmenities.some(wa => a.toLowerCase().includes(wa.toLowerCase()))
    )
    if (matchedAmenities.length > 0) {
      score += Math.min(matchedAmenities.length * 3, 12)
      pros.push(`Has ${matchedAmenities.length} requested amenities`)
    }

    for (const must of mustHaves) {
      const has =
        listing.amenities.some(a => a.toLowerCase().includes(must.toLowerCase())) ||
        (must === 'parking' && listing.parking) ||
        (must === 'pet-friendly' && listing.petFriendly) ||
        (must === 'laundry' && listing.laundry !== 'none')
      if (has) score += 5
      else { score -= 10; cons.push(`Missing must-have: ${must}`) }
    }

    for (const breaker of dealBreakers) {
      if (listing.amenities.some(a => a.toLowerCase().includes(breaker.toLowerCase()))) {
        score -= 20
        cons.push(`Has deal-breaker: ${breaker}`)
      }
    }

    if (listing.laundry === 'in-unit') { score += 5; pros.push('In-unit laundry') }
    if (listing.parking) score += 3

    const perPersonBudgetShare = Math.ceil(listing.price / people.length)
    const matchSummary = `At $${listing.price}/mo ($${perPersonBudgetShare}/person), this ${listing.bedrooms}-bedroom ${listing.type} in ${listing.neighborhood} ${listing.price <= totalBudget ? 'fits' : 'slightly exceeds'} the group's combined budget of $${totalBudget}.`

    return {
      listing,
      score: Math.max(0, Math.min(100, score)),
      matchSummary,
      perPersonBudgetShare,
      pros: pros.slice(0, 5),
      cons: cons.slice(0, 3),
    }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, 6)
}
