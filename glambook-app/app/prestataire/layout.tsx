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
  { href: '/prestataire/liste-attente', icon: Bell, label: 'Liste d\'attente' },
  { href: '/prestataire/paiements', icon: CreditCard, label: 'Paiements' },
  { href: '/prestataire/parametres', icon: Settings, label: 'Paramètres' },
]

export default function PrestatairLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="text-lg font-bold text-brand-500">GlamBook</div>
          <div className="text-xs text-gray-400 mt-0.5">Espace prestataire</div>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'text-brand-600 font-semibold bg-brand-50 border-r-2 border-brand-500'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
