'use client'

import { useState } from 'react'
import { Leaf } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Mode = 'signin' | 'signup' | 'forgot'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const reset = (m: Mode) => { setMode(m); setError(null); setMessage(null) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError(error.message)
      else setMessage('Check your email for a password reset link.')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account, then sign in. If you already have an account, sign in instead.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(16,185,129,0.06) 0%, transparent 50%),
                           radial-gradient(circle at 70% 80%, rgba(20,184,166,0.04) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Leaf size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Cal AI</h1>
          <p className="text-slate-400">AI-powered calorie tracker</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5 backdrop-blur">
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-white/5 p-1">
              {(['signin', 'signup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => reset(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                    ${mode === m ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <h2 className="text-white font-semibold text-lg">Reset Password</h2>
              <p className="text-slate-400 text-sm mt-1">Enter your email and we&apos;ll send a reset link.</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-slate-400 text-sm mb-1.5 block" htmlFor="name">Your name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Aditya"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>
            )}
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm"
              />
            </div>
            {mode !== 'forgot' && (
              <div>
                <label className="text-slate-400 text-sm mb-1.5 block" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-sm"
                />
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => reset('forgot')}
                    className="text-slate-500 hover:text-emerald-400 text-xs mt-2 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
            {message && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>

            {mode === 'forgot' && (
              <button type="button" onClick={() => reset('signin')} className="w-full text-slate-400 hover:text-white text-sm transition-colors">
                Back to sign in
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
