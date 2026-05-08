'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AvisPage() {
  const router = useRouter()
  const [rdvsTermines, setRdvsTermines] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [note, setNote] = useState(0)
  const [hover, setHover] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [prestataireId, setPrestataireId] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [avisExistants, setAvisExistants] = useState<any[]>([])

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: cliente } = await supabase.from('clientes').select('id,prestataire_id').eq('user_id', user.id).single()
    if (!cliente) return
    setClienteId(cliente.id)
    setPrestataireId(cliente.prestataire_id)

    const { data: rdvs } = await supabase
      .from('rendez_vous')
      .select('*, prestation:prestations(nom)')
      .eq('cliente_id', cliente.id)
      .eq('statut', 'termine')
      .order('date_rdv', { ascending: false })

    const { data: avis } = await supabase.from('avis').select('rdv_id').eq('cliente_id', cliente.id)
    setAvisExistants((avis||[]).map((a:any) => a.rdv_id))
    setRdvsTermines((rdvs||[]).filter((r:any) => !(avis||[]).map((a:any) => a.rdv_id).includes(r.id)))
  }

  async function submitAvis() {
    if (!selected || !note || !clienteId) return
    setSending(true)
    await supabase.from('avis').insert({
      prestataire_id: prestataireId,
      cliente_id: clienteId,
      rdv_id: selected.id,
      note,
      commentaire: commentaire.trim() || null,
      valide: true,
    })
    setSending(false)
    setDone(true)
  }

  const LABELS = ['','Décevant 😕','Peut mieux faire 😐','Bien 🙂','Très bien 😊','Excellent ! 🌟']

  if (done) return (
    <div className="p-6 flex flex-col items-center justify-center min-h-96 text-center">
      <div className="text-6xl mb-4">🌟</div>
      <h2 className="text-xl font-bold mb-2">Merci pour votre avis !</h2>
      <p className="text-sm mb-6">Votre avis aide votre prestataire à s'améliorer.</p>
      <button onClick={() => router.push('/cliente/mes-rdv')} className="px-6 py-3 rounded-xl text-white font-medium" style={{background:'var(--accent)'}}>
        Retour à mes RDV
      </button>
    </div>
  )

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-1">Laisser un avis</h1>
      <p className="text-sm mb-4">Partagez votre expérience avec votre prestataire</p>

      {!selected ? (
        <div>
          {rdvsTermines.length === 0 ? (
            <div style={{background:'var(--card)'}}>
              <div className="text-4xl mb-3">✅</div>
              <div className="font-medium text-gray-700 mb-1">Aucun avis à laisser</div>
              <div className="text-sm">Vos prochaines prestations terminées apparaîtront ici</div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium text-gray-600 mb-3">Choisissez une prestation à noter :</div>
              <div className="space-y-2">
                {rdvsTermines.map(rdv => (
                  <button key={rdv.id} onClick={() => setSelected(rdv)}
                    style={{background:'var(--card)'}}>
                    <div className="font-medium">{(rdv.prestation as any)?.nom}</div>
                    <div className="text-xs mt-0.5">
                      {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}
                    </div>
                    <div className="mt-2 text-xs font-medium" style={{color:'var(--accent)'}}>Laisser un avis →</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{background:'var(--card)'}}>
            <div className="font-medium text-gray-700">{(selected.prestation as any)?.nom}</div>
            <div className="text-xs mt-0.5">{new Date(selected.date_rdv).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
          </div>

          <div style={{background:'var(--card)'}}>
            <div className="text-sm font-medium text-gray-700 mb-4">Comment s'est passée cette prestation ?</div>
            <div className="flex gap-3 justify-center mb-3">
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  onClick={() => setNote(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="text-4xl transition-all hover:scale-125">
                  <span style={{color: n <= (hover||note) ? 'var(--accent)' : '#e5e7eb'}}>★</span>
                </button>
              ))}
            </div>
            <div className="text-sm font-medium" style={{color:'var(--accent)', minHeight:'20px'}}>
              {LABELS[hover||note]}
            </div>
          </div>

          <div style={{background:'var(--card)'}}>
            <div className="text-sm font-medium text-gray-700 mb-2">Votre commentaire (optionnel)</div>
            <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
              rows={4} placeholder="Partagez votre expérience en détail..."
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-pink-300"
            />
          </div>

          <button onClick={submitAvis} disabled={sending || note === 0}
            className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-40 mb-2"
            style={{background:'var(--accent)'}}>
            {sending ? 'Envoi...' : `Envoyer mon avis ${note > 0 ? '⭐'.repeat(note) : ''}`}
          </button>
          <button onClick={() => setSelected(null)} className="w-full py-2 text-sm hover:text-gray-600">
            ← Choisir une autre prestation
          </button>
        </div>
      )}
    </div>
  )
}
