'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/lib/theme'

const navItems = [
  { href: '/cliente/accueil', icon: '🏠', label: 'Accueil' },
  { href: '/cliente/reserver', icon: '📅', label: 'Réserver' },
  { href: '/cliente/mes-rdv', icon: '📋', label: 'Mes RDV' },
  { href: '/cliente/carnet', icon: '💅', label: 'Carnet' },
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
    <div className="min-h-screen pb-20" style={{background:'var(--bg2)'}}>
      <div className="sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between" style={{background:'var(--card)', borderColor:'var(--border)'}}>
        <div className="text-lg font-bold" style={{color:'#FF80B5'}}>GlamBook</div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={handleLogout} className="text-xs" style={{color:'var(--text3)'}}>Déconnexion</button>
        </div>
      </div>
      <main className="max-w-2xl mx-auto">
        {children}
      </main>
      <div className="fixed bottom-0 left-0 right-0 flex z-10 shadow-lg border-t" style={{background:'var(--card)', borderColor:'var(--border)'}}>
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-2 gap-0.5">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs" style={{color: active ? '#FF80B5' : 'var(--text3)', fontWeight: active ? 600 : 400}}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
