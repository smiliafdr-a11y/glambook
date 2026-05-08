'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const STATUT_CFG: Record<string, {label:string,color:string,bg:string}> = {
  confirme:   { label: 'Confirmé',   color: 'var(--accent)',   bg: 'var(--accent-bg)' },
  en_attente: { label: 'En attente', color: 'var(--warn)',     bg: 'var(--warn-bg)' },
  termine:    { label: 'Terminé',    color: 'var(--ok)',       bg: 'var(--ok-bg)' },
  annule:     { label: 'Annulé',     color: 'var(--text3)',    bg: 'var(--bg2)' },
  no_show:    { label: 'No-show',    color: '#ef4444',         bg: '#fff1f2' },
}

export default function DashboardPage() {
  const [prestataire, setPrestataire] = useState<any>(null)
  const [rdvAujourdhui, setRdvAujourdhui] = useState<any[]>([])
  const [stats, setStats] = useState({ rdvMois: 0, caThisMonth: 0, nbClientes: 0, acomptes: 0 })
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pres } = await supabase.from('prestataires').select('*').eq('user_id', user.id).single()
    if (!pres) return
    setPrestataire(pres)

    const today = new Date().toISOString().split('T')[0]
    const { data: rdvs } = await supabase
      .from('rendez_vous')
      .select('*, cliente:clientes(nom, prenom), prestation:prestations(nom)')
      .eq('prestataire_id', pres.id).eq('date_rdv', today).order('heure_debut')
    setRdvAujourdhui(rdvs || [])

    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const { data: rdvsMois } = await supabase
      .from('rendez_vous').select('prix_total,acompte_montant,acompte_paye,statut')
      .eq('prestataire_id', pres.id).gte('date_rdv', startMonth).neq('statut','annule')

    const { count: nbClientes } = await supabase
      .from('clientes').select('*', {count:'exact',head:true}).eq('prestataire_id', pres.id)

    const { data: msgs } = await supabase
      .from('messages').select('*, cliente:clientes(prenom,nom)')
      .eq('prestataire_id', pres.id).eq('lu', false).order('created_at', {ascending:false}).limit(3)
    setMessages(msgs || [])

    const ca = rdvsMois?.filter(r => r.statut === 'termine').reduce((s,r) => s+(r.prix_total||0), 0) || 0
    const acomptes = rdvsMois?.filter(r => r.acompte_paye).reduce((s,r) => s+(r.acompte_montant||0), 0) || 0
    setStats({ rdvMois: rdvsMois?.length || 0, caThisMonth: ca, nbClientes: nbClientes || 0, acomptes })
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
      <div style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
    </div>
  )

  const dateStr = new Date().toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long'})

  const statsCards = [
    { label: 'RDV ce mois', value: stats.rdvMois, sub: 'réservations', color: 'var(--accent)' },
    { label: 'CA du mois', value: `${stats.caThisMonth} €`, sub: 'encaissé', color: 'var(--ok)' },
    { label: 'Acomptes', value: `${stats.acomptes} €`, sub: 'sécurisés', color: '#6366f1' },
    { label: 'Clientes', value: stats.nbClientes, sub: 'au total', color: 'var(--warn)' },
  ]

  return (
    <div className="anim-up" style={{ padding: '24px', maxWidth: 900 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>
          Bonjour {prestataire?.prenom} ✨
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 3, textTransform: 'capitalize' }}>{dateStr}</p>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {statsCards.map((s, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* MESSAGES NON LUS */}
      {messages.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--accent-mid)', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              💬 Messages
              <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{messages.length}</span>
            </div>
            <Link href="/prestataire/messages" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map(m => {
              const initials = `${(m.cliente as any)?.prenom?.[0] || ''}${(m.cliente as any)?.nom?.[0] || ''}`
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--accent-bg)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{(m.cliente as any)?.prenom} {(m.cliente as any)?.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.contenu}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* RDV DU JOUR */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Rendez-vous aujourd'hui</h2>
          <Link href="/prestataire/agenda" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Voir l'agenda →</Link>
        </div>
        {rdvAujourdhui.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌟</div>
            <p style={{ fontSize: 13 }}>Aucun rendez-vous aujourd'hui</p>
            <Link href="/prestataire/agenda" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>Ajouter un RDV</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rdvAujourdhui.map(rdv => {
              const cfg = STATUT_CFG[rdv.statut] || STATUT_CFG.confirme
              return (
                <div key={rdv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--bg2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', minWidth: 45 }}>{rdv.heure_debut?.slice(0,5)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(rdv.cliente as any)?.prenom} {(rdv.cliente as any)?.nom}
                      {rdv.acompte_paye && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--ok-bg)', color: 'var(--ok)', padding: '2px 7px', borderRadius: 20 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{(rdv.prestation as any)?.nom} · {rdv.prix_total} €</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ACTIONS RAPIDES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 16 }}>
        {[
          { href: '/prestataire/agenda', icon: '📅', label: 'Nouveau RDV' },
          { href: '/prestataire/clientes', icon: '👤', label: 'Clientes' },
          { href: '/prestataire/liste-attente', icon: '🔔', label: 'Attente' },
        ].map((a, i) => (
          <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{a.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
