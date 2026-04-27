'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/cliente/accueil', icon: '🏠', label: 'Accueil' },
  { href: '/cliente/reserver', icon: '📅', label: 'Réserver' },
  { href: '/cliente/mes-rdv', icon: '📋', label: 'Mes RDV' },
  { href: '/cliente/contact', icon: '💬', label: 'Contact' },
]

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="text-lg font-bold" style={{color:'#FF80B5'}}>GlamBook</div>
        <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">Déconnexion</button>
      </div>

      {/* CONTENU */}
      <main className="max-w-lg mx-auto">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-2 gap-0.5">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs" style={{color: active ? '#FF80B5' : '#9ca3af', fontWeight: active ? 600 : 400}}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
