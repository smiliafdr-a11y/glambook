'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Users, Scissors, Bell, CreditCard, Settings, LogOut, LayoutDashboard } from 'lucide-react'

const navItems = [
  { href: '/prestataire/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/prestataire/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/prestataire/clientes', icon: Users, label: 'Clientes' },
  { href: '/prestataire/prestations', icon: Scissors, label: 'Prestations' },
  { href: '/prestataire/liste-attente', icon: Bell, label: "Liste d'attente" },
  { href: '/prestataire/paiements', icon: CreditCard, label: 'Paiements' },
  { href: '/prestataire/parametres', icon: Settings, label: 'Paramètres' },
]

export default function PrestataireLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#f8f4f6'}}>
      {/* SIDEBAR NOIRE */}
      <aside className="w-52 flex flex-col flex-shrink-0" style={{background:'#111111'}}>
        <div className="px-4 py-5 border-b border-white/10">
          <div className="text-lg font-bold" style={{color:'#E91E8C'}}>GlamBook</div>
          <div className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.4)'}}>Espace prestataire</div>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                style={{
                  color: active ? '#E91E8C' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 600 : 400,
                  background: active ? 'rgba(233,30,140,0.1)' : 'transparent',
                  borderRight: active ? '2px solid #E91E8C' : '2px solid transparent',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors border-t"
          style={{color:'rgba(255,255,255,0.3)', borderColor:'rgba(255,255,255,0.1)'}}
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  )
}
