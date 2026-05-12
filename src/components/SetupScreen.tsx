import { useState } from 'react'
import { Plus, Search, Loader2, DollarSign } from 'lucide-react'
import { Person } from '@/types'
import { PersonCard } from './PersonCard'

interface SetupScreenProps {
  people: Person[]
  onPeopleChange: (people: Person[]) => void
  onSearch: () => void
  isLoading: boolean
}

function createPerson(id: string): Person {
  return {
    id,
    name: '',
    budget: 0,
    preferences: { location: '', state: '', bedrooms: 2, amenities: [], mustHave: [], dealBreakers: [] },
  }
}

export function SetupScreen({ people, onPeopleChange, onSearch, isLoading }: SetupScreenProps) {
  const addPerson = () => {
    if (people.length < 4) onPeopleChange([...people, createPerson(crypto.randomUUID())])
  }
  const removePerson = (id: string) => onPeopleChange(people.filter(p => p.id !== id))
  const updatePerson = (updated: Person) =>
    onPeopleChange(people.map(p => (p.id === updated.id ? updated : p)))

  const totalBudget = people.reduce((sum, p) => sum + (p.budget || 0), 0)
  const canSearch = people.length > 0 && people.every(p => p.name.trim() && p.budget > 0 && p.preferences.state && p.preferences.location)

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Build Your Group Profile</h1>
          <p className="text-slate-400">Add up to 4 people and set everyone&apos;s budget and preferences</p>
        </div>

        {totalBudget > 0 && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Combined Monthly Budget</div>
                <div className="text-xl font-bold text-white">${totalBudget.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">
                {people.length} {people.length === 1 ? 'person' : 'people'}
              </div>
              <div className="text-sm text-violet-400">
                ~${Math.round(totalBudget / people.length).toLocaleString()}/person
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {people.map((person, index) => (
            <PersonCard
              key={person.id}
              person={person}
              index={index}
              canRemove={people.length > 1}
              onUpdate={updatePerson}
              onRemove={() => removePerson(person.id)}
            />
          ))}
        </div>

        {people.length < 4 && (
          <button
            onClick={addPerson}
            className="w-full glass glass-hover rounded-2xl p-4 flex items-center justify-center gap-3 text-slate-400 hover:text-white transition-colors mb-6 border-dashed border-white/20"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-medium">Add Person ({people.length}/4)</span>
          </button>
        )}

        <button
          onClick={onSearch}
          disabled={!canSearch || isLoading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-200 shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-100 disabled:shadow-none disabled:scale-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding matches...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Find Matches
            </>
          )}
        </button>

        {!canSearch && (
          <p className="text-center text-slate-600 text-sm mt-3">
            Fill in name, budget, state, and city for everyone to continue
          </p>
        )}
      </div>
    </div>
  )
}
