'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'

const navItems = [
  { href: '/cliente/accueil', icon: (active: boolean) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10L12 3l9 7v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 21V12h6v9"/>
    </svg>
  ), label: 'Accueil' },
  { href: '/cliente/reserver', icon: (active: boolean) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v3M16 2v3M3 8h18"/><rect x="3" y="4" width="18" height="18" rx="2"/>
    </svg>
  ), label: 'Réserver' },
  { href: '/cliente/mes-rdv', icon: (active: boolean) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>
    </svg>
  ), label: 'Mes RDV' },
  { href: '/cliente/carnet', icon: (active: boolean) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ), label: 'Carnet' },
  { href: '/cliente/contact', icon: (active: boolean) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ), label: 'Contact' },
]

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen pb-20 scrollbar-hide" style={{ background: 'var(--bg2)' }}>
      {/* TOPBAR */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <span className="font-display" style={{ fontSize: 19, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.01em' }}>Glambook</span>
        <div className="flex items-center gap-2">
          <button onClick={toggle} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)', fontSize: 13 }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <a href="/cliente/choisir-prestataire" style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'none', padding: '4px 8px' }}>Ma presta.</a>
          <button onClick={handleLogout} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Déco.</button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 flex z-10 border-t" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-2 gap-0.5" style={{ color: active ? 'var(--accent)' : 'var(--text3)', textDecoration: 'none' }}>
              {item.icon(active)}
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{item.label}</span>
              {active && <div style={{ width: 18, height: 2, borderRadius: 1, background: 'var(--accent)' }} />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
