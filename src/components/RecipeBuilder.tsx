'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Zap, ChefHat } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  amount: string
}

interface Props {
  onClose: () => void
  onAnalyzed: (nutrition: unknown) => void
}

export function RecipeBuilder({ onClose, onAnalyzed }: Props) {
  const [recipeName, setRecipeName] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: crypto.randomUUID(), name: '', amount: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addIngredient = () => {
    setIngredients(prev => [...prev, { id: crypto.randomUUID(), name: '', amount: '' }])
  }

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id))
  }

  const updateIngredient = (id: string, field: 'name' | 'amount', value: string) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const analyze = async () => {
    const filled = ingredients.filter(i => i.name.trim())
    if (!filled.length) { setError('Add at least one ingredient'); return }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/analyze-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: recipeName, ingredients: filled }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }

      const nutrition = await res.json()
      onAnalyzed(nutrition)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat size={20} className="text-emerald-400" />
            <h2 className="text-white font-semibold text-lg">Recipe Builder</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="text-slate-400 text-sm mb-1.5 block">Recipe / meal name (optional)</label>
          <input
            type="text"
            value={recipeName}
            onChange={e => setRecipeName(e.target.value)}
            placeholder="e.g. Protein shake, Dal rice, Egg bhurji..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="text-slate-400 text-sm block">Ingredients</label>
          {ingredients.map((ing, i) => (
            <div key={ing.id} className="flex gap-2">
              <input
                type="text"
                value={ing.amount}
                onChange={e => updateIngredient(ing.id, 'amount', e.target.value)}
                placeholder="Amount"
                className="w-24 shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm"
              />
              <input
                type="text"
                value={ing.name}
                onChange={e => updateIngredient(ing.id, 'name', e.target.value)}
                placeholder={i === 0 ? 'e.g. whey protein, chicken breast...' : 'Ingredient'}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm"
              />
              {ingredients.length > 1 && (
                <button onClick={() => removeIngredient(ing.id)} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addIngredient}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
          >
            <Plus size={16} /> Add ingredient
          </button>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

        <button
          onClick={analyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
          ) : (
            <><Zap size={16} /> Analyze Nutrition</>
          )}
        </button>
      </div>
    </div>
  )
}
