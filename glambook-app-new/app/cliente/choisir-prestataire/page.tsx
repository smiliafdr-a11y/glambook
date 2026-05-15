
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ChoisirPrestatairePage() {
  const router = useRouter()
  const [prestataires, setPrestataires] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [currentPres, setCurrentPres] = useState<any>(null)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: cliente } = await supabase.from('clientes').select('id, prestataire_id').eq('user_id', user.id).maybeSingle()
    if (!cliente) { router.push('/auth/login'); return }
    setClienteId(cliente.id)

    if (cliente.prestataire_id) {
      const { data: pres } = await supabase.from('prestataires').select('*').eq('id', cliente.prestataire_id).maybeSingle()
      setCurrentPres(pres)
    }

    const { data } = await supabase.from('prestataires').select('*').order('prenom')
    setPrestataires(data || [])
    setLoading(false)
  }

  async function choisir(pres: any) {
    setLinking(true)
    await supabase.from('clientes').update({ prestataire_id: pres.id }).eq('id', clienteId)
    router.push('/cliente/accueil')
  }

  const filtered = prestataires.filter(p =>
    `${p.prenom} ${p.nom} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px' }}>
      {/* HEADER */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="font-display" style={{ fontSize: 24, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>Glambook</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            {currentPres ? 'Changer de prestataire' : 'Choisissez votre prestataire'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Sélectionnez la prestataire chez qui vous souhaitez réserver
          </p>
        </div>

        {/* PRESTATAIRE ACTUELLE */}
        {currentPres && (
          <div style={{ background: 'var(--accent-bg)', border: '1.5px solid var(--accent-mid)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Votre prestataire actuelle
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                {currentPres.prenom?.[0]}{currentPres.nom?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{currentPres.prenom} {currentPres.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{currentPres.email}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--ok-bg)', color: 'var(--ok)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>✓ Liée</span>
            </div>
          </div>
        )}

        {/* RECHERCHE */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom..."
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '11px 14px 11px 40px', fontSize: 14, outline: 'none', background: 'var(--card)', color: 'var(--text)' }}
          />
        </div>

        {/* LISTE PRESTATAIRES */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>Aucune prestataire trouvée</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(pres => {
              const isActive = currentPres?.id === pres.id
              return (
                <div key={pres.id} style={{
                  background: 'var(--card)', border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: 'var(--shadow)'
                }}>
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: isActive ? 'var(--accent)' : 'var(--bg2)', color: isActive ? '#fff' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {pres.prenom?.[0]}{pres.nom?.[0]}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{pres.prenom} {pres.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Prestataire beauté</div>
                    {pres.email && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{pres.email}</div>}
                  </div>

                  {/* Bouton */}
                  {isActive ? (
                    <span style={{ fontSize: 12, background: 'var(--accent-bg)', color: 'var(--accent)', padding: '6px 14px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>
                      ✓ Actuelle
                    </span>
                  ) : (
                    <button onClick={() => choisir(pres)} disabled={linking}
                      style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: linking ? 0.7 : 1 }}>
                      Choisir
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {currentPres && (
          <button onClick={() => router.push('/cliente/accueil')}
            style={{ width: '100%', marginTop: 20, padding: '12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
            ← Retour à l'accueil
          </button>
        )}
      </div>
    </div>
  )
}
