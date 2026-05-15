
'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function RechercheContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const [search, setSearch] = useState(q)
  const [prestataires, setPrestataires] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load(q) }, [q])

  async function load(query: string) {
    setLoading(true)
    let req = supabase.from('prestataires').select('*').order('prenom')
    if (query) {
      req = req.or(`prenom.ilike.%${query}%,nom.ilike.%${query}%`)
    }
    const { data } = await req
    setPrestataires(data || [])
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/recherche?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* HEADER RECHERCHE */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/" className="font-display" style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', flexShrink: 0 }}>✦ Glambook</Link>
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '0 14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nom, spécialité..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)', background: 'transparent', padding: '10px 0' }} />
            </div>
            <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Rechercher
            </button>
          </form>
        </div>
      </div>

      {/* RÉSULTATS */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
          {loading ? 'Recherche...' : `${prestataires.length} prestataire${prestataires.length > 1 ? 's' : ''} trouvée${prestataires.length > 1 ? 's' : ''}${q ? ` pour "${q}"` : ''}`}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Chargement...</div>
        ) : prestataires.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Aucune prestataire trouvée</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Essayez un autre terme de recherche</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prestataires.map(p => (
              <Link key={p.id} href={`/prestataire/${p.id}/profil`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: 'var(--shadow)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  {/* Avatar */}
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                    {p.prenom?.[0]}{p.nom?.[0]}
                  </div>
                  {/* Infos */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>{p.prenom} {p.nom}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>Prestataire beauté</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, background: 'var(--ok-bg)', color: 'var(--ok)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>✓ Accepte de nouvelles clientes</span>
                    </div>
                  </div>
                  {/* CTA */}
                  <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Voir le profil →
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<div style={{padding:40, textAlign:'center', color:'var(--text3)'}}>Chargement...</div>}>
      <RechercheContent />
    </Suspense>
  )
}
