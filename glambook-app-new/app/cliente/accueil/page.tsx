'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AccueilCliente() {
  const [prenom, setPrenom] = useState('')
  const [prochainsRdv, setProchainsRdv] = useState<any[]>([])
  const [prestataireLie, setPrestataireLie] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: cliente } = await supabase.from('clientes').select('*').eq('user_id', user.id).single()
    if (cliente) {
      setPrenom(cliente.prenom)
      setPrestataireLie(!!cliente.prestataire_id)
      const today = new Date().toISOString().split('T')[0]
      const { data: rdvs } = await supabase
        .from('rendez_vous')
        .select('*, prestation:prestations(nom), prestataire:prestataires(prenom, nom)')
        .eq('cliente_id', cliente.id)
        .gte('date_rdv', today)
        .neq('statut', 'annule')
        .order('date_rdv')
        .limit(3)
      setProchainsRdv(rdvs || [])
    }
    setLoading(false)
  }

  const heure = new Date().getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bonjour' : 'Bonsoir'

  const actions = [
    { label: 'Réserver', sub: 'Un nouveau RDV', href: '/cliente/reserver',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v3M16 2v3M3 8h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg> },
    { label: 'Mes RDV', sub: "Voir l'historique", href: '/cliente/mes-rdv',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg> },
    { label: 'Contact', sub: 'Envoyer un message', href: '/cliente/contact',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { label: 'Carnet', sub: 'Mon historique beauté', href: '/cliente/carnet',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  ]

  return (
    <div className="anim-up p-4">
      {/* ALERTE — pas de prestataire liée */}
      {!prestataireLie && (
        <a href="/cliente/choisir-prestataire" style={{
          display:'block', background:'var(--accent)', borderRadius:14, padding:'14px 18px',
          marginBottom:16, textDecoration:'none', color:'#fff'
        }}>
          <div style={{fontWeight:700, fontSize:13, marginBottom:3}}>⚠️ Choisissez votre prestataire</div>
          <div style={{fontSize:12, opacity:0.85}}>Pour réserver et envoyer des messages, sélectionnez votre prestataire beauté →</div>
        </a>
      )}
      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, #C24567 0%, #7E2440 100%)', borderRadius: 20, padding: '22px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -24, top: -24, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', right: 36, bottom: -36, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{salut}</div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: '#fff', marginBottom: 18, position: 'relative' }}>
          {prenom || 'Bienvenue'}
        </h2>
        {prochainsRdv.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 13, padding: '12px 14px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prochain RDV</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
              {new Date(prochainsRdv[0].date_rdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
              {(prochainsRdv[0].prestation as any)?.nom} · {prochainsRdv[0].heure_debut?.slice(0,5)}
            </div>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {actions.map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 14, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9, color: 'var(--accent)' }}>
                {a.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* PROCHAINS RDV */}
      {prochainsRdv.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prochains rendez-vous</h3>
            <Link href="/cliente/mes-rdv" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Voir tout</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prochainsRdv.map(rdv => (
              <div key={rdv.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0, fontSize: 18 }}>💅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{(rdv.prestation as any)?.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {rdv.heure_debut?.slice(0,5)}
                  </div>
                </div>
                {rdv.acompte_paye && (
                  <span style={{ fontSize: 11, background: 'var(--ok-bg)', color: 'var(--ok)', padding: '3px 9px', borderRadius: 20, fontWeight: 600 }}>Acompte ✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {prochainsRdv.length === 0 && !loading && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💅</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Aucun RDV à venir</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Réservez votre prochaine prestation !</div>
          <Link href="/cliente/reserver">
            <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 11, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Réserver maintenant
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
