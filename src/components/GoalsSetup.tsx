'use client'

import { useState } from 'react'
import { Leaf, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export interface Goals {
  calories_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
}

interface Props {
  userId: string
  existing?: Goals
  onSaved: (goals: Goals) => void
  isEdit?: boolean
  onClose?: () => void
}

export function GoalsSetup({ userId, existing, onSaved, isEdit, onClose }: Props) {
  const [calories, setCalories] = useState(String(existing?.calories_goal ?? ''))
  const [protein, setProtein] = useState(String(existing?.protein_goal ?? ''))
  const [carbs, setCarbs] = useState(String(existing?.carbs_goal ?? ''))
  const [fat, setFat] = useState(String(existing?.fat_goal ?? ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!calories || !protein || !carbs || !fat) {
      setError('Please fill in all fields')
      return
    }
    setError(null)
    setLoading(true)

    const goals: Goals = {
      calories_goal: parseInt(calories),
      protein_goal: parseInt(protein),
      carbs_goal: parseInt(carbs),
      fat_goal: parseInt(fat),
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, ...goals })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    onSaved(goals)
    setLoading(false)
  }

  const fields = [
    { label: 'Daily Calories', value: calories, set: setCalories, unit: 'kcal', placeholder: 'e.g. 2500', color: 'text-emerald-400' },
    { label: 'Protein', value: protein, set: setProtein, unit: 'g/day', placeholder: 'e.g. 150', color: 'text-blue-400' },
    { label: 'Carbs', value: carbs, set: setCarbs, unit: 'g/day', placeholder: 'e.g. 300', color: 'text-orange-400' },
    { label: 'Fat', value: fat, set: setFat, unit: 'g/day', placeholder: 'e.g. 80', color: 'text-pink-400' },
  ]

  if (isEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl p-6 space-y-5"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1" />
          <div className="flex items-center gap-2">
            <Target size={20} className="text-emerald-400" />
            <h2 className="text-white font-semibold text-lg">Edit Goals</h2>
          </div>

          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <label className="text-slate-400 text-sm w-32 shrink-0">{f.label}</label>
                <input
                  type="number"
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm"
                />
                <span className={`text-sm shrink-0 w-12 ${f.color}`}>{f.unit}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <button
            onClick={save}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 30% 20%, rgba(16,185,129,0.06) 0%, transparent 50%),
                         radial-gradient(circle at 70% 80%, rgba(20,184,166,0.04) 0%, transparent 50%)`,
      }} />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Leaf size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set Your Goals</h1>
          <p className="text-slate-400 text-sm">We&apos;ll track your daily intake against these targets</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur">
          {fields.map(f => (
            <div key={f.label}>
              <div className="flex justify-between mb-1.5">
                <label className="text-slate-400 text-sm">{f.label}</label>
                <span className={`text-xs ${f.color}`}>{f.unit}</span>
              </div>
              <input
                type="number"
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm"
              />
            </div>
          ))}

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <button
            onClick={save}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? 'Saving...' : "Let's go!"}
          </button>
        </div>
      </div>
    </div>
  )
}
