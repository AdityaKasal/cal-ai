'use client'

import { useState, useEffect } from 'react'
import { X, Users, Zap, Calendar, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserRow {
  id: string
  email: string
  name: string
  joined: string
  lastSeen: string | null
  totalScans: number
  todayScans: number
}

interface Props {
  onClose: () => void
}

export function AdminPanel({ onClose }: Props) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''

    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.sort((a: UserRow, b: UserRow) => b.totalScans - a.totalScans))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const fmt = (iso: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const totalScans = users.reduce((acc, u) => acc + u.totalScans, 0)
  const todayScans = users.reduce((acc, u) => acc + u.todayScans, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-emerald-400" />
              <h2 className="text-white font-semibold text-lg">Admin Panel</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="text-slate-400 hover:text-white transition-colors p-1">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Total Users', value: users.length, icon: Users },
                { label: 'Total Scans', value: totalScans, icon: Zap },
                { label: 'Today\'s Scans', value: todayScans, icon: Calendar },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-emerald-400 font-bold text-xl">{s.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center py-6">{error}</p>}

          {!loading && users.map(u => (
            <div key={u.id} className="bg-white/5 border border-white/8 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{u.name}</p>
                  <p className="text-slate-400 text-sm truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-emerald-400 font-bold">{u.totalScans} scans</p>
                  <p className="text-slate-500 text-xs">{u.todayScans} today</p>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span>Joined {fmt(u.joined)}</span>
                <span>Last seen {fmt(u.lastSeen)}</span>
              </div>
            </div>
          ))}

          {!loading && users.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-6">No users yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
