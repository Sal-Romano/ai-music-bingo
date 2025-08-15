'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Error signing in:', error)
      alert('Login failed: ' + error.message)
    } else {
      setShowLogin(false)
      setEmail('')
      setPassword('')
    }
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <button className="btn-secondary opacity-50 cursor-not-allowed" disabled>
        <div className="flex items-center space-x-2">
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Loading...</span>
        </div>
      </button>
    )
  }

  if (user) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="bg-white text-black px-6 py-2 rounded-full font-medium">
          👋 {user.email?.split('@')[0]}
        </div>
        <button
          onClick={handleSignOut}
          className="btn btn-danger"
        >
          Sign Out
        </button>
      </div>
    )
  }

  if (showLogin) {
    return (
      <div className="card max-w-md mx-auto">
        <h3 className="text-2xl font-bold text-center mb-6">Sign In to Play</h3>
        <form onSubmit={handleSignIn} className="space-y-6">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={authLoading}
              className="btn btn-primary flex-1"
            >
              {authLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowLogin(true)}
      className="btn btn-primary text-lg px-12 py-4"
    >
      🎵 Start Playing
    </button>
  )
}