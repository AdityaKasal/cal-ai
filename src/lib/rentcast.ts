import type { Listing } from '@/types'

export interface RentCastProperty {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  bedrooms: number
  bathrooms: number
  sqft?: number
  price: number
  propertyType: 'APARTMENT' | 'HOUSE' | 'CONDO' | 'TOWNHOUSE'
  image?: string
  description?: string
}

/**
 * Fetch rental listings from RentCast API
 * Filters for Chicago area rentals
 */
export async function fetchRentCastListings(
  city: string = 'Chicago',
  state: string = 'Illinois',
  limit: number = 50
): Promise<RentCastProperty[]> {
  const apiKey = process.env.RENTCAST_API_KEY

  if (!apiKey) {
    throw new Error('RENTCAST_API_KEY is not set')
  }

  try {
    const url = new URL('https://api.rentcast.io/v1/listings/rental/list')
    url.searchParams.append('city', city)
    url.searchParams.append('state', state)
    url.searchParams.append('limit', limit.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-Key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`RentCast API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching RentCast listings:', error)
    throw error
  }
}

/**
 * Transform RentCast property to internal Listing format
 */
export function transformRentCastToListing(
  property: RentCastProperty,
  index: number
): Listing {
  const typeMap: Record<string, 'apartment' | 'house' | 'condo' | 'townhouse'> = {
    APARTMENT: 'apartment',
    HOUSE: 'house',
    CONDO: 'condo',
    TOWNHOUSE: 'townhouse',
  }

  return {
    id: property.id,
    title: `${property.bedrooms}BR/${Math.floor(property.bathrooms)}BA in ${property.city}`,
    address: property.address,
    neighborhood: property.city,
    city: property.city,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft || 0,
    amenities: [],
    images: property.image ? [property.image] : [],
    description: property.description || `${property.bedrooms} bedroom, ${Math.floor(property.bathrooms)} bathroom ${typeMap[property.propertyType] || 'rental'} in ${property.city}.`,
    available: new Date().toISOString().split('T')[0],
    petFriendly: false,
    parking: false,
    laundry: 'none',
    type: typeMap[property.propertyType] || 'apartment',
  }
}
