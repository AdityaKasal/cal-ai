import { createClient } from '@supabase/supabase-js'
import type { Listing } from '@/types'
import { MOCK_LISTINGS } from '@/data/listings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// Fetch listings from Supabase; falls back to mock data if not configured
export async function getListings(): Promise<Listing[]> {
  if (!supabase) return MOCK_LISTINGS

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data || data.length === 0) {
    console.warn('Supabase listings fetch failed, using mock data:', error?.message)
    return MOCK_LISTINGS
  }

  // Map snake_case DB columns to camelCase Listing type
  return data.map(row => ({
    id: String(row.id),
    title: row.title,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city,
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sqft: row.sqft,
    amenities: row.amenities ?? [],
    images: row.images ?? [],
    description: row.description,
    available: row.available,
    petFriendly: row.pet_friendly,
    parking: row.parking,
    laundry: row.laundry,
    type: row.type,
  }))
}
