'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme'

const navItems = [
  { href: '/prestataire/dashboard', label: 'Dashboard', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { href: '/prestataire/agenda', label: 'Agenda', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v3M16 2v3M3 8h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg> },
  { href: '/prestataire/messages', label: 'Messages', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, badge: true },
  { href: '/prestataire/clientes', label: 'Clientes', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/prestataire/prestations', label: 'Prestations', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg> },
  { href: '/prestataire/liste-attente', label: "Attente", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { href: '/prestataire/paiements', label: 'Paiements', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
  { href: '/prestataire/parametres', label: 'Paramètres', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

export default function PrestataireLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()
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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* SIDEBAR */}
      <aside className="flex flex-col flex-shrink-0" style={{ width: 216, background: 'var(--sidebar)' }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="font-display" style={{ fontSize: 19, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.01em' }}>Glambook</div>
          <div style={{ fontSize: 10, color: 'rgba(240,234,248,0.3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Prestataire</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: '6px 0' }}>
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            const isMessages = item.href === '/prestataire/messages'
            return (
              <Link key={item.href} href={item.href}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 18px',
                  background: active ? 'var(--sidebar-active)' : 'transparent',
                  borderRight: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--sidebar-text)',
                  fontSize: 12, fontWeight: active ? 600 : 400, textDecoration: 'none',
                  transition: 'all 0.12s',
                }}>
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {isMessages && unreadCount > 0 && (
                  <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={toggle}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 18px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sidebar-text)', fontSize: 12, textAlign: 'left' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              {theme === 'light' ? <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/> : <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>}
            </svg>
            {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          </button>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 18px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sidebar-text)', fontSize: 12, textAlign: 'left' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
