'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CarnetBeautePage() {
  const [cliente, setCliente] = useState<any>(null)
  const [journal, setJournal] = useState<any[]>([])
  const [avis, setAvis] = useState<any[]>([])
  const [rdvs, setRdvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: c } = await supabase.from('clientes').select('*').eq('user_id', user.id).single()
    if (!c) return
    setCliente(c)

    const { data: j } = await supabase.from('journal_prestations').select('*').eq('cliente_id', c.id).order('date_prestation', {ascending:false})
    setJournal(j || [])

    const { data: a } = await supabase.from('avis').select('*, prestataire:prestataires(prenom,nom)').eq('cliente_id', c.id).order('created_at', {ascending:false})
    setAvis(a || [])

    const { data: r } = await supabase.from('rendez_vous').select('*, prestation:prestations(nom)').eq('cliente_id', c.id).eq('statut','termine').order('date_rdv',{ascending:false})
    setRdvs(r || [])

    setLoading(false)
  }

  if (loading) return <div className="p-6 text-center text-gray-400 text-sm">Chargement...</div>

  const totalDepense = rdvs.reduce((s,r) => s+(r.prix_total||0), 0)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Mon Carnet Beauté 💅</h1>
      <p className="text-sm text-gray-400 mb-4">Votre historique beauté personnel</p>

      {/* PROFIL */}
      <div className="rounded-2xl p-5 mb-4 text-white" style={{background:'linear-gradient(135deg, #FF80B5, #ff99c2)'}}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center font-bold text-lg">
            {cliente?.prenom?.[0]}{cliente?.nom?.[0]}
          </div>
          <div>
            <div className="font-bold">{cliente?.prenom} {cliente?.nom}</div>
            <div className="text-xs opacity-80">Cliente depuis {cliente?.premiere_visite ? new Date(cliente.premiere_visite).toLocaleDateString('fr-FR',{month:'long',year:'numeric'}) : 'récemment'}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/20 rounded-xl p-2 text-center">
            <div className="font-bold text-xl">{rdvs.length}</div>
            <div className="text-xs opacity-80">Prestations</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2 text-center">
            <div className="font-bold text-xl">{totalDepense} €</div>
            <div className="text-xs opacity-80">Total dépensé</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2 text-center">
            <div className="font-bold text-xl">{avis.length}</div>
            <div className="text-xs opacity-80">Avis laissés</div>
          </div>
        </div>
      </div>

      {/* ALLERGIES / NOTES */}
      {cliente?.allergies && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <div className="font-semibold text-red-700 text-xs mb-1">⚠️ Mes allergies / particularités</div>
          <div className="text-sm text-red-600">{cliente.allergies}</div>
        </div>
      )}

      {/* HISTORIQUE PRESTATIONS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">📋 Mon historique</h2>
        {rdvs.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">Aucune prestation terminée</div>
        ) : (
          <div className="space-y-3">
            {rdvs.slice(0,5).map(r => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="text-sm text-gray-400 min-w-[70px]">{new Date(r.date_rdv).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{(r.prestation as any)?.nom}</div>
                </div>
                <div className="text-sm font-semibold" style={{color:'#FF80B5'}}>{r.prix_total} €</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JOURNAL DE SOIN (notes de la prestataire) */}
      {journal.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">📝 Notes de ma prestataire</h2>
          <div className="space-y-3">
            {journal.map(j => (
              <div key={j.id} className="pb-3 border-b border-gray-50 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm text-gray-900">{j.prestation_nom}</div>
                  <div className="text-xs text-gray-400">{j.date_prestation ? new Date(j.date_prestation).toLocaleDateString('fr-FR') : ''}</div>
                </div>
                {j.notes_prestataire && (
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 border-l-2" style={{borderColor:'#FF80B5'}}>{j.notes_prestataire}</div>
                )}
                {j.recommandations && (
                  <div className="text-xs mt-1" style={{color:'#6366f1'}}>💡 {j.recommandations}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MES AVIS */}
      {avis.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">⭐ Mes avis</h2>
          <div className="space-y-2">
            {avis.map(a => (
              <div key={a.id} className="p-3 rounded-xl" style={{background:'#fff5f9'}}>
                <div className="flex items-center gap-2 mb-1">
                  <div style={{color:'#FF80B5'}}>{'★'.repeat(a.note)}{'☆'.repeat(5-a.note)}</div>
                  <div className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                {a.commentaire && <div className="text-xs text-gray-600 italic">"{a.commentaire}"</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
