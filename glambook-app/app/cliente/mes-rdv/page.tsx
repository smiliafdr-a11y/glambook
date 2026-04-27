'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MesRdvPage() {
  const [rdvs, setRdvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState<'avenir'|'passes'>('avenir')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: cliente } = await supabase.from('clientes').select('id').eq('user_id', user.id).single()
    if (!cliente) return
    const { data } = await supabase
      .from('rendez_vous')
      .select('*, prestation:prestations(nom,prix), prestataire:prestataires(prenom,nom)')
      .eq('cliente_id', cliente.id)
      .order('date_rdv', { ascending: false })
    setRdvs(data || [])
    setLoading(false)
  }

  async function annulerRdv(id: string) {
    if (!confirm('Confirmer l\'annulation ?')) return
    await supabase.from('rendez_vous').update({ statut: 'annule' }).eq('id', id)
    init()
  }

  const today = new Date().toISOString().split('T')[0]
  const rdvsAvenir = rdvs.filter(r => r.date_rdv >= today && r.statut !== 'annule')
  const rdvsPasses = rdvs.filter(r => r.date_rdv < today || r.statut === 'annule' || r.statut === 'termine')

  const STATUT: Record<string, {label:string,color:string,bg:string}> = {
    confirme: {label:'Confirmé', color:'#c05a8a', bg:'#fff5f9'},
    en_attente: {label:'En attente', color:'#b07d1a', bg:'#fffbe8'},
    termine: {label:'Terminé', color:'#2d7d4f', bg:'#edfaf3'},
    annule: {label:'Annulé', color:'#999', bg:'#f5f5f5'},
  }

  const liste = onglet === 'avenir' ? rdvsAvenir : rdvsPasses

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Mes rendez-vous</h1>

      {/* ONGLETS */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-4">
        <button onClick={() => setOnglet('avenir')} className="flex-1 py-2.5 text-sm font-medium transition-colors"
          style={{background: onglet==='avenir' ? '#FF80B5' : 'white', color: onglet==='avenir' ? 'white' : '#9ca3af'}}>
          À venir ({rdvsAvenir.length})
        </button>
        <button onClick={() => setOnglet('passes')} className="flex-1 py-2.5 text-sm font-medium transition-colors"
          style={{background: onglet==='passes' ? '#FF80B5' : 'white', color: onglet==='passes' ? 'white' : '#9ca3af'}}>
          Passés ({rdvsPasses.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
      ) : liste.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-3xl mb-2">💅</div>
          <div className="text-gray-500 text-sm mb-3">{onglet === 'avenir' ? 'Aucun RDV à venir' : 'Aucun RDV passé'}</div>
          {onglet === 'avenir' && (
            <Link href="/cliente/reserver" className="inline-block text-white text-sm px-4 py-2 rounded-xl" style={{background:'#FF80B5'}}>
              Réserver maintenant
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {liste.map(rdv => {
            const s = STATUT[rdv.statut] || STATUT.confirme
            return (
              <div key={rdv.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{(rdv.prestation as any)?.nom}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long'})} · {rdv.heure_debut?.slice(0,5)}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{background:s.bg, color:s.color}}>
                    {s.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="font-bold" style={{color:'#FF80B5'}}>{rdv.prix_total} €</div>
                  {rdv.acompte_paye && <div className="text-xs text-green-600">Acompte {rdv.acompte_montant} € ✓</div>}
                </div>

                {rdv.statut === 'confirme' || rdv.statut === 'en_attente' ? (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => annulerRdv(rdv.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium border border-red-200 text-red-400 hover:bg-red-50">
                      Annuler
                    </button>
                    <Link href="/cliente/contact" className="flex-1 py-2 rounded-lg text-xs font-medium text-center border"
                      style={{borderColor:'#ffd0e8', color:'#FF80B5'}}>
                      Contacter
                    </Link>
                  </div>
                ) : rdv.statut === 'termine' ? (
                  <Link href="/cliente/avis" className="mt-3 block text-center py-2 rounded-lg text-xs font-medium"
                    style={{background:'#fff5f9', color:'#FF80B5'}}>
                    ⭐ Laisser un avis
                  </Link>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
