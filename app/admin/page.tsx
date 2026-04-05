'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminLogin() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 24px' }}>
      <h1 style={{ marginBottom: 24 }}>Admin Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 12, fontSize: 16 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 12, fontSize: 16 }}
      />

      {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ width: '100%', padding: 12, fontSize: 16, cursor: 'pointer' }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  )
}