import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchRentCastListings, transformRentCastToListing } from '@/lib/rentcast'

/**
 * Admin endpoint to fetch listings from RentCast and populate Supabase
 * Usage: POST /api/admin/seed-rentcast
 * Optional body: { "city": "Chicago", "limit": 50 }
 */
export async function POST(request: NextRequest) {
  // Simple auth check (in production, use proper JWT/session validation)
  const authHeader = request.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const city = body.city || 'Tempe'
    const state = body.state || 'Arizona'
    const limit = body.limit || 50

    console.log(`Fetching ${limit} listings from RentCast for ${city}, ${state}...`)

    // Fetch from RentCast
    const rentCastListings = await fetchRentCastListings(city, state, limit)

    if (!rentCastListings.length) {
      return NextResponse.json({
        success: false,
        message: 'No listings found from RentCast',
      })
    }

    // Transform to internal format
    const transformedListings = rentCastListings.map((prop, idx) =>
      transformRentCastToListing(prop, idx)
    )

    // Prepare for Supabase insertion (snake_case)
    const dbListings = transformedListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      address: listing.address,
      neighborhood: listing.neighborhood,
      city: listing.city,
      price: listing.price,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft,
      amenities: listing.amenities,
      images: listing.images,
      description: listing.description,
      available: listing.available,
      pet_friendly: listing.petFriendly,
      parking: listing.parking,
      laundry: listing.laundry,
      type: listing.type,
    }))

    // Clear existing listings first (optional)
    // await supabase.from('listings').delete().neq('id', '0')

    // Insert new listings
    const { data, error } = await supabase
      .from('listings')
      .insert(dbListings)
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${data?.length || 0} listings from RentCast`,
      count: data?.length || 0,
      listings: data,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
