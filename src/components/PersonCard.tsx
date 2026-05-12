import { useState } from 'react';
import { X, ChevronDown, ChevronUp, User, DollarSign, MapPin, BedDouble, Plus } from 'lucide-react';
import { Person } from '@/types';
import { AMENITY_OPTIONS, LOCATION_OPTIONS, US_STATES } from '@/data/listings';

interface PersonCardProps {
  person: Person;
  index: number;
  canRemove: boolean;
  onUpdate: (person: Person) => void;
  onRemove: () => void;
}

const BEDROOM_OPTIONS = [1, 2, 3, 4];

export function PersonCard({ person, index, canRemove, onUpdate, onRemove }: PersonCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [mustHaveInput, setMustHaveInput] = useState('');
  const [dealBreakerInput, setDealBreakerInput] = useState('');

  const update = (patch: Partial<Person>) => onUpdate({ ...person, ...patch });
  const updatePrefs = (patch: Partial<Person['preferences']>) =>
    update({ preferences: { ...person.preferences, ...patch } });

  const toggleAmenity = (amenity: string) => {
    const current = person.preferences.amenities;
    updatePrefs({
      amenities: current.includes(amenity)
        ? current.filter(a => a !== amenity)
        : [...current, amenity],
    });
  };

  const addMustHave = () => {
    const val = mustHaveInput.trim();
    if (val && !person.preferences.mustHave.includes(val)) {
      updatePrefs({ mustHave: [...person.preferences.mustHave, val] });
    }
    setMustHaveInput('');
  };

  const addDealBreaker = () => {
    const val = dealBreakerInput.trim();
    if (val && !person.preferences.dealBreakers.includes(val)) {
      updatePrefs({ dealBreakers: [...person.preferences.dealBreakers, val] });
    }
    setDealBreakerInput('');
  };

  const colors = [
    { bg: 'from-violet-500 to-purple-600', ring: 'ring-violet-500/30', badge: 'bg-violet-500/20 text-violet-300' },
    { bg: 'from-indigo-500 to-blue-600', ring: 'ring-indigo-500/30', badge: 'bg-indigo-500/20 text-indigo-300' },
    { bg: 'from-pink-500 to-rose-600', ring: 'ring-pink-500/30', badge: 'bg-pink-500/20 text-pink-300' },
    { bg: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' },
  ];
  const color = colors[index % colors.length];

  return (
    <div className={`glass rounded-2xl overflow-hidden ring-1 ${color.ring}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {person.name ? person.name[0].toUpperCase() : <User className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-semibold text-white">
              {person.name || `Person ${index + 1}`}
            </div>
            <div className="text-slate-400 text-sm">
              {person.budget ? `$${person.budget.toLocaleString()}/mo` : 'Set budget'} ·{' '}
              {person.preferences.bedrooms} bd · {person.preferences.state && person.preferences.location ? `${person.preferences.location}, ${person.preferences.state}` : 'Any location'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(); }}
              className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-400 transition-colors flex items-center justify-center">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-white/5 pt-4">
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <User className="w-3.5 h-3.5" /> Name
              </label>
              <input
                type="text"
                value={person.name}
                onChange={e => update({ name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <DollarSign className="w-3.5 h-3.5" /> Monthly Budget
              </label>
              <input
                type="number"
                value={person.budget || ''}
                onChange={e => update({ budget: Number(e.target.value) })}
                placeholder="e.g. 1500"
                min={0}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
              />
            </div>
          </div>

          {/* State, City & Bedrooms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <MapPin className="w-3.5 h-3.5" /> State
              </label>
              <select
                value={person.preferences.state}
                onChange={e => updatePrefs({ state: e.target.value, location: '' })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors appearance-none"
              >
                <option value="">Select state</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <MapPin className="w-3.5 h-3.5" /> City
              </label>
              <input
                type="text"
                value={person.preferences.location}
                onChange={e => updatePrefs({ location: e.target.value })}
                placeholder="e.g. Tempe"
                disabled={!person.preferences.state}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <BedDouble className="w-3.5 h-3.5" /> Min Bedrooms
              </label>
              <div className="flex gap-2">
                {BEDROOM_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => updatePrefs({ bedrooms: n })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      person.preferences.bedrooms === n
                        ? `bg-gradient-to-br ${color.bg} text-white shadow-lg`
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-sm font-medium text-slate-400 mb-2 block">
              Desired Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(amenity => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    person.preferences.amenities.includes(amenity)
                      ? `${color.badge} ring-1 ring-current`
                      : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Must-haves & Deal Breakers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-400 mb-2 block">
                Must Have <span className="text-slate-600">(optional)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={mustHaveInput}
                  onChange={e => setMustHaveInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMustHave()}
                  placeholder="e.g. in-unit laundry"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 transition-colors"
                />
                <button onClick={addMustHave} className="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {person.preferences.mustHave.map(item => (
                  <span key={item} className="flex items-center gap-1 px-2.5 py-1 bg-green-500/15 text-green-400 rounded-lg text-xs font-medium">
                    {item}
                    <button onClick={() => updatePrefs({ mustHave: person.preferences.mustHave.filter(m => m !== item) })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400 mb-2 block">
                Deal Breakers <span className="text-slate-600">(optional)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={dealBreakerInput}
                  onChange={e => setDealBreakerInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addDealBreaker()}
                  placeholder="e.g. no pets allowed"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <button onClick={addDealBreaker} className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {person.preferences.dealBreakers.map(item => (
                  <span key={item} className="flex items-center gap-1 px-2.5 py-1 bg-red-500/15 text-red-400 rounded-lg text-xs font-medium">
                    {item}
                    <button onClick={() => updatePrefs({ dealBreakers: person.preferences.dealBreakers.filter(d => d !== item) })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
