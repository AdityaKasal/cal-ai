'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, Trash2, ChevronDown, ChevronUp, Zap, Leaf, History, LogOut, ChefHat, ShieldCheck } from 'lucide-react'
import { supabase, type DBLogEntry } from '@/lib/supabase'
import { AuthScreen } from '@/components/AuthScreen'
import { RecipeBuilder } from '@/components/RecipeBuilder'
import { AdminPanel } from '@/components/AdminPanel'
import type { User } from '@supabase/supabase-js'

interface NutritionData {
  foodName: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  confidence: 'high' | 'medium' | 'low'
  notes: string
}

const GOALS = { calories: 2650, protein: 150, carbs: 300, fat: 80 }
const RECIPE_PLACEHOLDER = 'recipe'

const CONFIDENCE_COLORS = { high: 'text-emerald-400', medium: 'text-yellow-400', low: 'text-red-400' }
const CONFIDENCE_LABELS = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }

function todayKey() {
  return new Date().toLocaleDateString('en-CA')
}

function formatDateLabel(dateKey: string) {
  const d = new Date(dateKey + 'T00:00:00')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateKey === todayKey()) return 'Today'
  if (dateKey === yesterday.toLocaleDateString('en-CA')) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

async function compressThumbnail(dataUrl: string, maxPx = 300): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = dataUrl
  })
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}g</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EntryImage({ imageUrl }: { imageUrl: string | null }) {
  if (!imageUrl || imageUrl === RECIPE_PLACEHOLDER) {
    return (
      <div className="w-14 h-14 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
        <ChefHat size={22} className="text-emerald-400" />
      </div>
    )
  }
  return <img src={imageUrl} alt="food" className="w-14 h-14 rounded-xl object-cover shrink-0" />
}

function NutritionCard({ entry, defaultOpen = true, onDelete }: {
  entry: DBLogEntry
  defaultOpen?: boolean
  onDelete?: () => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const confidence = (entry.confidence || 'medium') as 'high' | 'medium' | 'low'

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <EntryImage imageUrl={entry.image_url} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{entry.food_name}</p>
          <p className="text-slate-400 text-sm">{entry.serving_size} · {time}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-emerald-400 font-bold text-lg">{entry.calories}</p>
          <p className="text-slate-500 text-xs">kcal</p>
        </div>
        <div className="ml-1 text-slate-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Protein', value: entry.protein, color: 'text-blue-400' },
              { label: 'Carbs', value: entry.carbs, color: 'text-orange-400' },
              { label: 'Fat', value: entry.fat, color: 'text-pink-400' },
            ].map(m => (
              <div key={m.label} className="bg-white/5 rounded-xl p-3 text-center">
                <p className={`font-bold text-lg ${m.color}`}>{m.value}<span className="text-xs font-normal text-slate-400">g</span></p>
                <p className="text-slate-400 text-xs mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <MacroBar label="Protein" value={entry.protein} max={60} color="bg-blue-500" />
            <MacroBar label="Carbs" value={entry.carbs} max={120} color="bg-orange-500" />
            <MacroBar label="Fat" value={entry.fat} max={65} color="bg-pink-500" />
            <MacroBar label="Fiber" value={entry.fiber} max={30} color="bg-teal-500" />
            <MacroBar label="Sugar" value={entry.sugar} max={50} color="bg-yellow-500" />
          </div>
          {entry.is_recipe && entry.ingredients && (
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-slate-400 text-xs font-medium mb-1">Ingredients</p>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{entry.ingredients}</p>
            </div>
          )}
          <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
            <span className={`text-xs font-medium shrink-0 ${CONFIDENCE_COLORS[confidence]}`}>
              {CONFIDENCE_LABELS[confidence]}
            </span>
            <span className="text-slate-400 text-xs">&mdash; {entry.notes}</span>
          </div>
          {onDelete && (
            <button onClick={onDelete} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors">
              <Trash2 size={14} /> Remove from log
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DailyTotals({ entries, label }: { entries: DBLogEntry[]; label: string }) {
  const totals = entries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
  const calPct = Math.min(100, Math.round((totals.calories / GOALS.calories) * 100))

  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">{label}</h2>
        <span className="text-slate-400 text-sm">{entries.length} item{entries.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-5xl font-bold text-white">{totals.calories}</span>
        <span className="text-slate-400 mb-2">/ {GOALS.calories} kcal</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
        <div className={`h-full rounded-full transition-all duration-700 ${calPct >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${calPct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Protein', value: totals.protein, goal: GOALS.protein, color: 'text-blue-400' },
          { label: 'Carbs', value: totals.carbs, goal: GOALS.carbs, color: 'text-orange-400' },
          { label: 'Fat', value: totals.fat, goal: GOALS.fat, color: 'text-pink-400' },
        ].map(m => (
          <div key={m.label} className="text-center">
            <p className={`font-bold ${m.color}`}>{m.value}<span className="text-slate-500 font-normal text-xs">/{m.goal}g</span></p>
            <p className="text-slate-400 text-xs">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryDay({ dateKey, entries, onDelete }: { dateKey: string; entries: DBLogEntry[]; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const totalCal = entries.reduce((acc, e) => acc + e.calories, 0)

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <button className="w-full flex items-center justify-between p-4" onClick={() => setOpen(o => !o)}>
        <div className="text-left">
          <p className="text-white font-medium">{formatDateLabel(dateKey)}</p>
          <p className="text-slate-400 text-sm">{entries.length} items · {totalCal} kcal</p>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {entries.map(entry => (
            <NutritionCard key={entry.id} entry={entry} defaultOpen={false} onDelete={() => onDelete(entry.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [log, setLog] = useState<DBLogEntry[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showRecipe, setShowRecipe] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadLog = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
    setLog(data || [])
  }, [])

  useEffect(() => {
    if (user) loadLog(user.id)
    else setLog([])
  }, [user, loadLog])

  const saveEntry = async (nutrition: NutritionData, imageUrl: string, isRecipe = false, ingredients?: string) => {
    if (!user) return
    const now = new Date()
    const { data, error } = await supabase
      .from('food_logs')
      .insert({
        user_id: user.id,
        food_name: nutrition.foodName,
        serving_size: nutrition.servingSize,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber,
        sugar: nutrition.sugar,
        confidence: nutrition.confidence,
        notes: nutrition.notes,
        image_url: imageUrl,
        is_recipe: isRecipe,
        ingredients: ingredients ?? null,
        timestamp: now.toISOString(),
        date_key: now.toLocaleDateString('en-CA'),
      })
      .select()
      .single()

    if (!error && data) setLog(prev => [data, ...prev])
  }

  const deleteEntry = useCallback(async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id)
    setLog(prev => prev.filter(e => e.id !== id))
  }, [])

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ''
  }

  const analyze = useCallback(async (file: File) => {
    setError(null)
    setAnalyzing(true)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setPreview(dataUrl)
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
      const token = await getToken()

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ image: base64, mediaType }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Error ${res.status}`)
        }
        const nutrition: NutritionData = await res.json()
        const thumbnail = await compressThumbnail(dataUrl)
        await saveEntry(nutrition, thumbnail)
        setPreview(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed')
        setPreview(null)
      }
      setAnalyzing(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const onRecipeAnalyzed = useCallback(async (nutrition: unknown) => {
    await saveEntry(nutrition as NutritionData, RECIPE_PLACEHOLDER, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) analyze(file)
    e.target.value = ''
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) analyze(file)
  }, [analyze])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  const today = todayKey()
  const todayEntries = log.filter(e => e.date_key === today)
  const pastEntries = log.filter(e => e.date_key !== today)
  const pastByDate = pastEntries.reduce<Record<string, DBLogEntry[]>>((acc, e) => {
    acc[e.date_key] = acc[e.date_key] ? [e, ...acc[e.date_key]] : [e]
    return acc
  }, {})
  const pastDates = Object.keys(pastByDate).sort((a, b) => b.localeCompare(a))
  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 30% 20%, rgba(16,185,129,0.06) 0%, transparent 50%),
                         radial-gradient(circle at 70% 80%, rgba(20,184,166,0.04) 0%, transparent 50%)`,
      }} />

      {showRecipe && <RecipeBuilder onClose={() => setShowRecipe(false)} onAnalyzed={onRecipeAnalyzed} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-6 pb-safe">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Leaf size={20} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">Cal AI</h1>
            <p className="text-slate-400 text-xs truncate">Hey {userName} 👋</p>
          </div>
          <div className="flex items-center gap-2">
            {user.email === 'aditya.kasal@gmail.com' && (
              <button
                onClick={() => setShowAdmin(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <ShieldCheck size={14} />
              </button>
            )}
            {pastDates.length > 0 && (
              <button
                onClick={() => setShowHistory(o => !o)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-colors
                  ${showHistory ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                <History size={14} />
              </button>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Upload area */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
            ${dragging ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-white/5'}
            ${analyzing ? 'pointer-events-none' : 'cursor-pointer hover:border-emerald-500/40'}`}
          onClick={() => !analyzing && fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

          {analyzing && preview ? (
            <div className="relative">
              <img src={preview} alt="Analyzing" className="w-full max-h-72 object-cover opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-full">
                  <Zap size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">Analyzing with AI...</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <Camera size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Snap your food</p>
                <p className="text-slate-400 text-sm mt-1">Take a photo or drag &amp; drop</p>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-xl">
                  <Camera size={15} /> Camera
                </div>
                <div className="flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-xl">
                  <Upload size={15} /> Upload
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recipe builder button */}
        <button
          onClick={() => setShowRecipe(true)}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium py-3 rounded-xl transition-colors"
        >
          <ChefHat size={16} className="text-emerald-400" /> AI couldn&apos;t identify it? Build manually
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
        )}

        {/* Today */}
        {!showHistory && (
          <>
            {todayEntries.length > 0 && <DailyTotals entries={todayEntries} label="Today's Totals" />}
            {todayEntries.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-white font-semibold">Today&apos;s Log</h2>
                {todayEntries.map((entry, i) => (
                  <NutritionCard key={entry.id} entry={entry} defaultOpen={i === 0} onDelete={() => deleteEntry(entry.id)} />
                ))}
              </div>
            )}
            {todayEntries.length === 0 && !analyzing && (
              <div className="text-center py-6 space-y-2">
                <p className="text-slate-500 text-sm">No food logged yet today</p>
                <p className="text-slate-600 text-xs">Take a photo or build a recipe to get started</p>
              </div>
            )}
          </>
        )}

        {/* History */}
        {showHistory && (
          <div className="space-y-3">
            <h2 className="text-white font-semibold">History</h2>
            {pastDates.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No history yet</p>
            ) : (
              pastDates.map(dateKey => (
                <HistoryDay key={dateKey} dateKey={dateKey} entries={pastByDate[dateKey]} onDelete={deleteEntry} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
