'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminNav() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-200 mb-8">
      <h1 className="text-xl font-semibold">Hackathon Admin</h1>
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
      >
        Log out
      </button>
    </nav>
  )
}