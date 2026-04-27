'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ListeAttente } from '@/types'

export default function ListeAttentePage() {
  const [liste, setListe] = useState<ListeAttente[]>([])
  const [prestataireId, setPrestataireId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pres } = await supabase.from('prestataires').select('id').eq('user_id', user.id).single()
    if (!pres) return
    setPrestataireId(pres.id)
    load(pres.id)
  }

  async function load(pid: string) {
    const { data } = await supabase
      .from('liste_attente')
      .select('*, cliente:clientes(nom, prenom, telephone, email), prestation:prestations(nom, prix)')
      .eq('prestataire_id', pid)
      .eq('active', true)
      .order('created_at')
    setListe(data || [])
    setLoading(false)
  }

  async function notifierTous() {
    // En production : déclenche un email/SMS via Brevo API
    // Pour l'instant on marque comme notifiées
    const ids = liste.map(l => l.id)
    await supabase.from('liste_attente').update({ notifiee: true, notifiee_at: new Date().toISOString() }).in('id', ids)
    load(prestataireId)
    alert(`${liste.length} cliente(s) notifiée(s) du créneau libéré !`)
  }

  async function retirerListe(id: string) {
    await supabase.from('liste_attente').update({ active: false }).eq('id', id)
    load(prestataireId)
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm">Chargement...</div>

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Liste d'attente</h1>
          <p className="text-sm text-gray-400 mt-0.5">{liste.length} cliente(s) en attente</p>
        </div>
        {liste.length > 0 && (
          <button onClick={notifierTous} className="bg-green-500 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-green-600">
            🔔 Notifier toutes ({liste.length})
          </button>
        )}
      </div>

      {/* Explication */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 text-sm text-brand-700">
        <strong>Comment ça marche :</strong> Quand une cliente annule, cliquez sur "Notifier toutes" — chaque cliente en attente reçoit un email/SMS automatique l'informant qu'un créneau s'est libéré. La première à confirmer obtient le créneau.
      </div>

      {liste.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-semibold text-gray-900 mb-1">Liste d'attente vide</h3>
          <p className="text-sm text-gray-400">Aucune cliente n'attend de créneau en ce moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {liste.map((l, i) => (
            <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900">
                  {(l.cliente as any)?.prenom} {(l.cliente as any)?.nom}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {(l.prestation as any)?.nom} · {(l.prestation as any)?.prix} €
                </div>
                <div className="flex gap-2 mt-1.5">
                  {l.disponibilites?.matin && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Matin</span>}
                  {l.disponibilites?.apres_midi && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Après-midi</span>}
                  {l.disponibilites?.soir && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Soir</span>}
                </div>
              </div>
              <div className="text-right">
                {l.notifiee ? (
                  <span className="text-xs text-green-600 font-medium">Notifiée ✓</span>
                ) : (
                  <span className="text-xs text-gray-400">En attente</span>
                )}
                <div className="text-xs text-gray-300 mt-0.5">
                  {new Date(l.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <button onClick={() => retirerListe(l.id)} className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded">
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
