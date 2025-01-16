import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })

  return (
    <div className="flex flex-col max-w-7xl mx-auto px-8 py-16">
      <div className="flex-1">{children}</div>
    </div>
  )
}