'use client'

import { useState } from 'react'
import TeamLogin from '@/app/components/contestant/TeamLogin'
import CheckoutView from '@/app/components/contestant/CheckoutView'

type Team = {
  id: string
  name: string
  group_code: string
  budget_total: number
  budget_used: number
  contact_email: string
}

export default function Home() {
  const [team, setTeam] = useState<Team | null>(null)

  if (!team) return <TeamLogin onLogin={setTeam} />
  return <CheckoutView team={team} />
}