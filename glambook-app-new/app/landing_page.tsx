'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) router.push(`/recherche?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: '"DM Sans", sans-serif' }}>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)' }}>
        <span className="font-display" style={{ fontSize: 22, fontWeight: 600, color: 'var(--accent)' }}>✦ Glambook</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ padding: '8px 18px', fontSize: 13, color: 'var(--text2)', textDecoration: 'none', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--card)' }}>
            Se connecter
          </Link>
          <Link href="/auth/register?role=prestataire" style={{ padding: '8px 18px', fontSize: 13, background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 9, fontWeight: 600 }}>
            Vous êtes prestataire ?
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #C24567 0%, #7E2440 100%)', padding: '64px 24px 80px', textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: 42, fontWeight: 600, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
          Trouvez votre prestataire beauté
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>
          Réservez en ligne, 24h/24, sans téléphone
        </p>

        {/* BARRE DE RECHERCHE */}
        <form onSubmit={handleSearch} style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 0, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C24567" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, spécialité, prestataire..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#1C1510', padding: '16px 0', background: 'transparent' }}
            />
          </div>
          <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            Rechercher
          </button>
        </form>

        {/* SUGGESTIONS RAPIDES */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {['Pose d\'ongles', 'Lissage brésilien', 'Maquillage', 'Soins visage'].map(s => (
            <button key={s} onClick={() => router.push(`/recherche?q=${encodeURIComponent(s)}`)}
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section style={{ padding: '56px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 className="font-display" style={{ fontSize: 28, fontWeight: 600, textAlign: 'center', color: 'var(--text)', marginBottom: 40 }}>
          Comment ça marche ?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { num: '1', title: 'Cherchez', desc: 'Tapez le nom ou la spécialité de votre prestataire beauté', icon: '🔍' },
            { num: '2', title: 'Choisissez', desc: 'Consultez le profil, les prestations et les disponibilités', icon: '💅' },
            { num: '3', title: 'Réservez', desc: 'Créez votre compte et confirmez votre RDV en 1 clic', icon: '✅' },
          ].map(s => (
            <div key={s.num} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>{s.num}</div>
              <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
        <div className="font-display" style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>✦ Glambook</div>
        <p>La plateforme beauté pensée par et pour les prestataires.</p>
      </footer>
    </div>
  )
}
