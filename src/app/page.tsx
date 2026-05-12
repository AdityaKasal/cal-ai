'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Trash2, ChevronDown, ChevronUp, Zap, Leaf } from 'lucide-react'

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

interface LogEntry {
  id: string
  imageUrl: string
  nutrition: NutritionData
  timestamp: Date
}

const CONFIDENCE_COLORS = {
  high: 'text-emerald-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
}

const CONFIDENCE_LABELS = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
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
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function NutritionCard({ nutrition, imageUrl, onDelete, defaultOpen = true }: {
  nutrition: NutritionData
  imageUrl: string
  onDelete?: () => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <img src={imageUrl} alt={nutrition.foodName} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{nutrition.foodName}</p>
          <p className="text-slate-400 text-sm">{nutrition.servingSize}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-emerald-400 font-bold text-lg">{nutrition.calories}</p>
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
              { label: 'Protein', value: nutrition.protein, unit: 'g', color: 'text-blue-400' },
              { label: 'Carbs', value: nutrition.carbs, unit: 'g', color: 'text-orange-400' },
              { label: 'Fat', value: nutrition.fat, unit: 'g', color: 'text-pink-400' },
            ].map(m => (
              <div key={m.label} className="bg-white/5 rounded-xl p-3 text-center">
                <p className={`font-bold text-lg ${m.color}`}>{m.value}<span className="text-xs font-normal text-slate-400">g</span></p>
                <p className="text-slate-400 text-xs mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <MacroBar label="Protein" value={nutrition.protein} max={60} color="bg-blue-500" />
            <MacroBar label="Carbs" value={nutrition.carbs} max={120} color="bg-orange-500" />
            <MacroBar label="Fat" value={nutrition.fat} max={65} color="bg-pink-500" />
            <MacroBar label="Fiber" value={nutrition.fiber} max={30} color="bg-teal-500" />
            <MacroBar label="Sugar" value={nutrition.sugar} max={50} color="bg-yellow-500" />
          </div>

          <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
            <span className={`text-xs font-medium shrink-0 ${CONFIDENCE_COLORS[nutrition.confidence]}`}>
              {CONFIDENCE_LABELS[nutrition.confidence]}
            </span>
            <span className="text-slate-400 text-xs">&mdash; {nutrition.notes}</span>
          </div>

          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              <Trash2 size={14} /> Remove from log
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DailyTotals({ log }: { log: LogEntry[] }) {
  const totals = log.reduce(
    (acc, e) => ({
      calories: acc.calories + e.nutrition.calories,
      protein: acc.protein + e.nutrition.protein,
      carbs: acc.carbs + e.nutrition.carbs,
      fat: acc.fat + e.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const goalCal = 2000
  const calPct = Math.min(100, Math.round((totals.calories / goalCal) * 100))

  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Today&apos;s Totals</h2>
        <span className="text-slate-400 text-sm">{log.length} item{log.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-5xl font-bold text-white">{totals.calories}</span>
        <span className="text-slate-400 mb-2">/ {goalCal} kcal</span>
      </div>

      <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-700 ${calPct >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${calPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Protein', value: totals.protein, color: 'text-blue-400' },
          { label: 'Carbs', value: totals.carbs, color: 'text-orange-400' },
          { label: 'Fat', value: totals.fat, color: 'text-pink-400' },
        ].map(m => (
          <div key={m.label} className="text-center">
            <p className={`font-bold ${m.color}`}>{m.value}g</p>
            <p className="text-slate-400 text-xs">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [log, setLog] = useState<LogEntry[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mediaType }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Error ${res.status}`)
        }

        const nutrition: NutritionData = await res.json()
        setLog(prev => [
          { id: crypto.randomUUID(), imageUrl: dataUrl, nutrition, timestamp: new Date() },
          ...prev,
        ])
        setPreview(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed')
        setPreview(null)
      }

      setAnalyzing(false)
    }
  }, [])

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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(16,185,129,0.06) 0%, transparent 50%),
                           radial-gradient(circle at 70% 80%, rgba(20,184,166,0.04) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-6 pb-safe">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Leaf size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Cal AI</h1>
            <p className="text-slate-400 text-xs">AI-powered calorie tracker</p>
          </div>
        </div>

        {/* Upload area */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
            ${dragging ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-white/5'}
            ${analyzing ? 'pointer-events-none' : 'cursor-pointer hover:border-emerald-500/40 hover:bg-white/8'}`}
          onClick={() => !analyzing && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />

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
            <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <Camera size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Snap your food</p>
                <p className="text-slate-400 text-sm mt-1">Take a photo or drag &amp; drop an image</p>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 transition-colors text-white text-sm font-medium px-4 py-2 rounded-xl">
                  <Camera size={15} /> Camera
                </div>
                <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 transition-colors text-white text-sm font-medium px-4 py-2 rounded-xl">
                  <Upload size={15} /> Upload
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Daily totals */}
        {log.length > 0 && <DailyTotals log={log} />}

        {/* Food log */}
        {log.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-white font-semibold">Today&apos;s Log</h2>
            {log.map((entry, i) => (
              <NutritionCard
                key={entry.id}
                nutrition={entry.nutrition}
                imageUrl={entry.imageUrl}
                defaultOpen={i === 0}
                onDelete={() => setLog(prev => prev.filter(e => e.id !== entry.id))}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {log.length === 0 && !analyzing && (
          <div className="text-center py-6 space-y-2">
            <p className="text-slate-500 text-sm">No food logged yet today</p>
            <p className="text-slate-600 text-xs">Take a photo to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
