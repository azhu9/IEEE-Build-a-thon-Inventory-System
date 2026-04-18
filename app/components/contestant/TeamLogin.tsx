'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Team = {
  id: string
  name: string
  group_code: string
  budget_total: number
  budget_used: number
  contact_email: string
}

type Props = {
  onLogin: (team: Team) => void
}

export default function TeamLogin({ onLogin }: Props) {
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!code.trim()) return
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('group_code', code.trim().toUpperCase())
      .single()

    if (error || !data) {
      setError('Team code not found. Double check your code and try again.')
      setLoading(false)
    } else {
      onLogin(data)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Electronics Checkout</h1>
        <p className="text-gray-700 text-sm mb-6">Enter your team code to get started</p>

        <input
          type="text"
          placeholder="e.g. TEAM-01"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 uppercase tracking-widest"
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {loading ? 'Looking up team...' : 'Continue'}
        </button>
        <a
          href="https://docs.google.com/forms/d/1iKEJEmt-SLFxxRLPph_IXrLSyviedWjId-MAuR-oEuI/edit"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 my-4 bg-gray-200 outline-solid text-black rounded-md font-medium hover:bg-gray-100 text-center cursor-pointer transition-colors"
        >
          Sign up Form
        </a>
        <p className="text-gray-500 text-sm mt-4">If you don`t have a team number, please sign up to create one</p>
        
      </div>

      <div>
      </div>
    </div>
  )
}