'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilPrestatairePage() {
  const { id } = useParams()
  const router = useRouter()
  const [prestataire, setPrestataire] = useState<any>(null)
  const [prestations, setPrestations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => { init() }, [id])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data: pres } = await supabase.from('prestataires').select('*').eq('id', id).maybeSingle()
    setPrestataire(pres)
    const { data: prests } = await supabase.from('prestations').select('*').eq('prestataire_id', id).eq('actif', true)
    setPrestations(prests || [])
    setLoading(false)
  }

  async function prendreRdv() {
    if (!user) {
      router.push(`/auth/register?role=cliente&prestataire_id=${id}`)
      return
    }
    // Cliente connectée — lier à cette prestataire
    const { data: cliente } = await supabase.from('clientes').select('id, prestataire_id').eq('user_id', user.id).maybeSingle()
    if (cliente) {
      await supabase.from('clientes').update({ prestataire_id: id }).eq('id', cliente.id)
    }
    // Passer l'id en URL pour que reserver puisse l'utiliser directement
    router.push(`/cliente/reserver?prestataire_id=${id}`)
  }

  async function envoyerMessage() {
    if (!user) { router.push(`/auth/register?role=cliente&prestataire_id=${id}`); return }
    const { data: cliente } = await supabase.from('clientes').select('id, prestataire_id').eq('user_id', user.id).maybeSingle()
    if (cliente) {
      await supabase.from('clientes').update({ prestataire_id: id }).eq('id', cliente.id)
    }
    router.push('/cliente/contact')
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>Chargement...</div>
  if (!prestataire) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>Prestataire introuvable</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg2)' }}>
      {/* NAV */}
      <nav style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/recherche" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontSize: 13 }}>
          ← Retour aux résultats
        </Link>
        <span className="font-display" style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>✦ Glambook</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {!user && <Link href="/auth/login" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none', padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>Se connecter</Link>}
          {user && <Link href="/cliente/accueil" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', padding: '7px 14px', border: '1px solid var(--accent-mid)', borderRadius: 8 }}>Mon espace</Link>}
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* COLONNE GAUCHE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* HEADER PROFIL */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
                {prestataire.prenom?.[0]}{prestataire.nom?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{prestataire.prenom} {prestataire.nom}</h1>
                <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 8 }}>Prestataire beauté</div>
                <span style={{ fontSize: 12, background: 'var(--ok-bg)', color: 'var(--ok)', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                  ✓ Accepte de nouvelles clientes
                </span>
              </div>
            </div>
          </div>

          {/* PRESTATIONS */}
          {prestations.length > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Prestations</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {prestations.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{p.nom}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                        ⏱ {p.duree_minutes < 60 ? `${p.duree_minutes}min` : `${Math.floor(p.duree_minutes/60)}h${p.duree_minutes%60 ? p.duree_minutes%60+'min' : ''}`}
                        {p.acompte > 0 && ` · Acompte ${p.acompte} €`}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{p.prix} €</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE — CTA sticky */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, textAlign: 'center' }}>En résumé</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--text2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Accepte de nouvelles clientes
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📅</span> Réservation en ligne 24h/24
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💳</span> Acompte sécurisé
              </div>
            </div>

            <button onClick={prendreRdv}
              style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 11, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
              📅 Prendre rendez-vous
            </button>
            <button onClick={envoyerMessage}
              style={{ width: '100%', background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 11, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              💬 Envoyer un message
            </button>

            {!user && (
              <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                Vous serez invitée à créer un compte gratuitement
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
