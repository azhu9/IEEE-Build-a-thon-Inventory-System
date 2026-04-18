'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import TeamMembersPanel from './TeamMembersPanel'

type Team = {
  id: string
  name: string
  group_code: string
  contact_email: string
  budget_total: number
  budget_used: number
  created_at: string
}

type Member = {
  name: string
  email: string
}

export default function TeamsManager() {
  const supabase = createClient()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)
  const [sendingEmails, setSendingEmails] = useState(false)

  const [budget, setBudget] = useState('200')
  const [members, setMembers] = useState<Member[]>([{ name: '', email: '' }])
  const [error, setError] = useState('')

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })
    setTeams(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTeams() }, [])

  function generateCode() {
    const num = Math.floor(100 + Math.random() * 900)
    return `TEAM-${num}`
  }

  // function generateName(existingCount: number) {
  //   return `Team ${existingCount + 1}`
  // }

  function updateMember(index: number, field: 'name' | 'email', value: string) {
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function addMemberRow() {
    setMembers(prev => [...prev, { name: '', email: '' }])
  }

  function removeMemberRow(index: number) {
    setMembers(prev => prev.filter((_, i) => i !== index))
  }

  async function handleCreate() {
    const validMembers = members.filter(m => m.name.trim() && m.email.trim())
    if (validMembers.length === 0) {
      setError('Add at least one member with a name and email.')
      return
    }

    setCreating(true)
    setError('')

    const group_code = generateCode()
    const teamName = group_code

    const { data: team, error: insertError } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        contact_email: validMembers[0].email,
        budget_total: parseFloat(budget),
        budget_used: 0,
        group_code,
      })
      .select()
      .single()

    if (insertError || !team) {
      setError(insertError?.message ?? 'Failed to create team.')
      setCreating(false)
      return
    }

    // Insert all members
    await supabase.from('team_members').insert(
      validMembers.map(m => ({
        team_id: team.id,
        name: m.name.trim(),
        email: m.email.trim(),
      }))
    )

    // Send welcome emails to all members
    setSendingEmails(true)
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        members: validMembers,
        teamName,
        groupCode: group_code,
      }),
    })
    setSendingEmails(false)

    setMembers([{ name: '', email: '' }])
    setBudget('200')
    setShowForm(false)
    setCreating(false)
    fetchTeams()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this team? This cannot be undone.')) return
    await supabase.from('teams').delete().eq('id', id)
    fetchTeams()
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  function toggleExpand(teamId: string) {
    setExpandedTeam(prev => prev === teamId ? null : teamId)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Teams</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 cursor-pointer transition-colors"
        >
          {showForm ? 'Cancel' : '+ New team'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold mb-1">Create new team</h3>
          <p className="text-xs text-gray-400 mb-4">Team name and code will be auto-generated. Add all members below.</p>

          {/* Budget */}
          <div className="mb-4 w-40">
            <label className="text-xs text-gray-500 mb-1 block">Budget ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>

          {/* Members */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-2 block">Team members</label>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={m.name}
                    onChange={e => updateMember(i, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={m.email}
                    onChange={e => updateMember(i, 'email', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  {members.length > 1 && (
                    <button
                      onClick={() => removeMemberRow(i)}
                      className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors text-sm px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addMemberRow}
              className="mt-2 text-xs text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
            >
              + Add another member
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={creating || sendingEmails}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {creating ? 'Creating team...' : sendingEmails ? 'Sending welcome emails...' : 'Create team & send emails'}
          </button>
        </div>
      )}

      {/* Teams table */}
      {loading && <p className="text-gray-400 text-sm">Loading teams...</p>}
      {!loading && teams.length === 0 && (
        <p className="text-gray-400 text-center py-12">No teams yet</p>
      )}
      {teams.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left text-gray-600">
              <th className="py-3 px-3">Team name</th>
              <th className="py-3 px-3">Group code</th>
              <th className="py-3 px-3">Budget</th>
              <th className="py-3 px-3">Spent</th>
              <th className="py-3 px-3">Remaining</th>
              <th className="py-3 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <>
                <tr
                  key={team.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(team.id)}
                >
                  <td className="py-3 px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{expandedTeam === team.id ? '▲' : '▼'}</span>
                      {team.name}
                    </div>
                  </td>
                  <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs tracking-widest">
                        {team.group_code}
                      </span>
                      <button
                        onClick={() => copyCode(team.group_code)}
                        className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors text-xs"
                      >
                        {copiedCode === team.group_code ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3">${team.budget_total.toFixed(2)}</td>
                  <td className="py-3 px-3 text-gray-500">${team.budget_used.toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <span className={`font-medium ${
                      (team.budget_total - team.budget_used) <= 0
                        ? 'text-red-500'
                        : (team.budget_total - team.budget_used) < 20
                        ? 'text-amber-500'
                        : 'text-emerald-600'
                    }`}>
                      ${(team.budget_total - team.budget_used).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {expandedTeam === team.id && (
                  <tr key={`${team.id}-members`} className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={6} className="px-6 py-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Team members</p>
                      <TeamMembersPanel teamId={team.id} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}