import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: components } = await supabase.from('components').select('*')

  return (
    <pre>{JSON.stringify(components, null, 2)}</pre>
  )
}