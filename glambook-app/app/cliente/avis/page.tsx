'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AvisPage() {
  const router = useRouter()
  const [rdvsTermines, setRdvsTermines] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: cliente } = await supabase.from('clientes').select('id').eq('user_id', user.id).single()
    if (!cliente) return
    setClienteId(cliente.id)
    const { data } = await supabase
      .from('rendez_vous')
      .select('*, prestation:prestations(nom)')
      .eq('cliente_id', cliente.id)
      .eq('statut', 'termine')
      .order('date_rdv', { ascending: false })
    // Filtrer ceux qui n'ont pas encore d'avis
    const { data: avisExistants } = await supabase.from('avis').select('rdv_id').eq('cliente_id', cliente.id)
    const rdvAvecAvis = new Set((avisExistants||[]).map((a:any) => a.rdv_id))
    setRdvsTermines((data||[]).filter((r:any) => !rdvAvecAvis.has(r.id)))
  }

  async function submitAvis() {
    if (!selected || !note || !clienteId) return
    setSending(true)
    await supabase.from('avis').insert({
      prestataire_id: selected.prestataire_id,
      cliente_id: clienteId,
      rdv_id: selected.id,
      note,
      commentaire,
    })
    setSending(false)
    setDone(true)
    setTimeout(() => router.push('/cliente/mes-rdv'), 2000)
  }

  if (done) return (
    <div className="p-4 flex flex-col items-center justify-center min-h-64">
      <div className="text-5xl mb-3">🌟</div>
      <div className="text-xl font-bold text-gray-900 mb-1">Merci pour votre avis !</div>
      <div className="text-sm text-gray-400">Votre avis a été envoyé avec succès.</div>
    </div>
  )

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Laisser un avis</h1>
      <p className="text-sm text-gray-400 mb-4">Vos avis aident votre prestataire à s'améliorer</p>

      {!selected ? (
        <div>
          <div className="text-sm font-medium text-gray-600 mb-3">Choisissez une prestation à noter</div>
          {rdvsTermines.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-gray-500 text-sm">Aucun avis à laisser pour le moment</div>
            </div>
          ) : (
            <div className="space-y-2">
              {rdvsTermines.map(rdv => (
                <button key={rdv.id} onClick={() => setSelected(rdv)}
                  className="w-full bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-pink-200">
                  <div className="font-medium text-gray-900">{(rdv.prestation as any)?.nom}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
            <div className="font-medium text-gray-700 mb-1">{(selected.prestation as any)?.nom}</div>
            <div className="text-xs text-gray-400">{new Date(selected.date_rdv).toLocaleDateString('fr-FR', {day:'numeric',month:'long'})}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Votre note</div>
            <div className="flex gap-2 justify-center mb-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setNote(n)} className="text-4xl transition-transform hover:scale-110">
                  <span style={{color: n <= note ? '#FF80B5' : '#e5e7eb'}}>★</span>
                </button>
              ))}
            </div>
            <div className="text-center text-xs text-gray-400">
              {note === 0 ? 'Cliquez pour noter' : note === 1 ? 'Décevant' : note === 2 ? 'Peut mieux faire' : note === 3 ? 'Bien' : note === 4 ? 'Très bien' : 'Excellent !'}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Votre commentaire</div>
            <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
              rows={4} placeholder="Partagez votre expérience..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{focusBorderColor:'#FF80B5'} as any}
            />
          </div>

          <button onClick={submitAvis} disabled={sending || !note}
            className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-40"
            style={{background:'#FF80B5'}}>
            {sending ? 'Envoi...' : 'Envoyer mon avis ⭐'}
          </button>
        </div>
      )}
    </div>
  )
}
