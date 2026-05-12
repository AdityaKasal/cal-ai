import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface DBLogEntry {
  id: string
  user_id: string
  food_name: string
  serving_size: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  confidence: string
  notes: string
  image_url: string | null
  is_recipe: boolean
  ingredients: string | null
  timestamp: string
  date_key: string
}
