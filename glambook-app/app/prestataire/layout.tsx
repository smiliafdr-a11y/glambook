'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/lib/theme'
import { Calendar, Users, Scissors, Bell, CreditCard, Settings, LogOut, LayoutDashboard, MessageCircle } from 'lucide-react'

const navItems = [
  { href: '/prestataire/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/prestataire/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/prestataire/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/prestataire/clientes', icon: Users, label: 'Clientes' },
  { href: '/prestataire/prestations', icon: Scissors, label: 'Prestations' },
  { href: '/prestataire/liste-attente', icon: Bell, label: "Liste d'attente" },
  { href: '/prestataire/paiements', icon: CreditCard, label: 'Paiements' },
  { href: '/prestataire/parametres', icon: Settings, label: 'Paramètres' },
]

export default function PrestataireLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUnread()
    const interval = setInterval(loadUnread, 15000)
    return () => clearInterval(interval)
  }, [])

  async function loadUnread() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pres } = await supabase.from('prestataires').select('id').eq('user_id', user.id).single()
    if (!pres) return
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true })
      .eq('prestataire_id', pres.id).eq('expediteur', 'cliente').eq('lu', false)
    setUnreadCount(count || 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'var(--bg2)'}}>
      {/* SIDEBAR */}
      <aside className="w-52 flex flex-col flex-shrink-0" style={{background:'var(--sidebar)'}}>
        <div className="px-4 py-4 border-b flex items-center justify-between" style={{borderColor:'rgba(255,255,255,0.08)'}}>
          <div>
            <div className="text-base font-bold" style={{color:'#FF80B5'}}>GlamBook</div>
            <div className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.35)'}}>Prestataire</div>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            const isMessages = item.href === '/prestataire/messages'
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all"
                style={{
                  color: active ? '#FF80B5' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 600 : 400,
                  background: active ? 'rgba(255,128,181,0.12)' : 'transparent',
                  borderRight: active ? '2px solid #FF80B5' : '2px solid transparent',
                }}>
                <item.icon size={15} />
                <span className="flex-1">{item.label}</span>
                {isMessages && unreadCount > 0 && (
                  <span className="text-xs text-white px-1.5 py-0.5 rounded-full font-bold" style={{background:'#FF80B5'}}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-3 text-sm transition-all border-t"
          style={{color:'rgba(255,255,255,0.3)', borderColor:'rgba(255,255,255,0.08)'}}>
          <LogOut size={15} />
          Déconnexion
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto" style={{background:'var(--bg)'}}>
        {children}
      </main>
    </div>
  )
}
