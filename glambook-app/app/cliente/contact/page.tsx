'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ContactPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [prestataireId, setPrestataireId] = useState('')
  const [prestataire, setPrestataire] = useState<any>(null)
  const [onglet, setOnglet] = useState<'chat'|'faq'>('chat')
  const [sending, setSending] = useState(false)
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const FAQ = [
    { q: "Comment fonctionne l'acompte ?", r: "Un acompte est demandé à la réservation pour sécuriser votre créneau. Il est déduit du total le jour J. En cas d'annulation moins de 24h avant, l'acompte est conservé." },
    { q: "Comment annuler ou reporter ?", r: "Depuis 'Mes RDV', cliquez sur votre rendez-vous puis 'Annuler'. Annulation gratuite jusqu'à 24h avant. Au-delà, l'acompte est retenu." },
    { q: "Puis-je payer en espèces ?", r: "Oui ! Lors de la réservation, sélectionnez 'Paiement en espèces le jour J'. Vous réglez directement votre prestataire lors de votre venue." },
    { q: "Comment rejoindre la liste d'attente ?", r: "Contactez votre prestataire via ce chat pour être ajoutée à la liste d'attente. Vous serez notifiée dès qu'un créneau se libère." },
    { q: "J'ai une allergie, comment le signaler ?", r: "Mentionnez-le directement dans ce chat avant votre premier RDV. Votre prestataire le notera dans votre fiche et adaptera les produits utilisés." },
  ]

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: cliente } = await supabase.from('clientes').select('*').eq('user_id', user.id).single()
    if (!cliente) return
    setClienteId(cliente.id)
    setPrestataireId(cliente.prestataire_id)
    const { data: pres } = await supabase.from('prestataires').select('*').eq('id', cliente.prestataire_id).single()
    setPrestataire(pres)
    await loadMessages(cliente.id, cliente.prestataire_id)

    // Realtime subscription
    const channel = supabase.channel(`messages-${cliente.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `cliente_id=eq.${cliente.id}`
      }, async () => {
        await loadMessages(cliente.id, cliente.prestataire_id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function loadMessages(cId: string, pId: string) {
    const { data } = await supabase.from('messages').select('*')
      .eq('cliente_id', cId)
      .eq('prestataire_id', pId)
      .order('created_at')
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 100)
  }

  async function sendMessage() {
    const txt = newMsg.trim()
    if (!txt || !clienteId || !prestataireId || sending) return
    setSending(true)
    setNewMsg('')
    const { error } = await supabase.from('messages').insert({
      prestataire_id: prestataireId,
      cliente_id: clienteId,
      expediteur: 'cliente',
      contenu: txt,
      lu: false,
    })
    if (error) console.error('Erreur envoi message:', error)
    await loadMessages(clienteId, prestataireId)
    setSending(false)
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'calc(100vh - 120px)'}}>
      {/* HEADER */}
      <div className="p-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{background:'#FF80B5'}}>
            {prestataire?.prenom?.[0]}{prestataire?.nom?.[0]}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{prestataire?.prenom} {prestataire?.nom}</div>
            <div className="text-xs text-green-500">Disponible</div>
          </div>
        </div>
        <div className="flex border border-gray-200 rounded-xl overflow-hidden mt-3">
          <button onClick={() => setOnglet('chat')} className="flex-1 py-2 text-sm font-medium transition-colors"
            style={{background: onglet==='chat' ? '#FF80B5' : 'white', color: onglet==='chat' ? 'white' : '#9ca3af'}}>
            💬 Chat
          </button>
          <button onClick={() => setOnglet('faq')} className="flex-1 py-2 text-sm font-medium transition-colors"
            style={{background: onglet==='faq' ? '#FF80B5' : 'white', color: onglet==='faq' ? 'white' : '#9ca3af'}}>
            ❓ FAQ
          </button>
        </div>
      </div>

      {onglet === 'chat' ? (
        <>
          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{background:'#fdf8fb'}}>
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">💬</div>
                <div className="text-gray-400 text-sm">Envoyez un message à votre prestataire</div>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.expediteur === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                <div style={{maxWidth:'75%'}}>
                  {m.expediteur === 'prestataire' && (
                    <div className="text-xs font-semibold mb-1" style={{color:'#FF80B5'}}>{prestataire?.prenom}</div>
                  )}
                  <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: m.expediteur === 'cliente' ? '#FF80B5' : 'white',
                      color: m.expediteur === 'cliente' ? 'white' : '#333',
                      borderBottomRightRadius: m.expediteur === 'cliente' ? 4 : 16,
                      borderBottomLeftRadius: m.expediteur === 'prestataire' ? 4 : 16,
                      border: m.expediteur === 'prestataire' ? '1px solid #eee' : 'none',
                    }}>
                    {m.contenu}
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5 px-1">
                    {new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* RÉPONSES RAPIDES */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-50 flex-shrink-0" style={{scrollbarWidth:'none'}}>
            {["Bonjour 👋","C'est quoi le tarif ?","Avez-vous des disponibilités ?","Merci !"].map(r => (
              <button key={r} onClick={() => setNewMsg(r)} className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border"
                style={{borderColor:'#ffd0e8', color:'#FF80B5', whiteSpace:'nowrap'}}>
                {r}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }}}
              placeholder="Écrire un message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none"
            />
            <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              style={{background:'#FF80B5'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-xs text-green-700">
            Tu ne trouves pas ta réponse ? Utilise le chat pour contacter directement ta prestataire.
          </div>
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  className="w-full px-4 py-3 text-left flex justify-between items-center text-sm font-medium text-gray-900">
                  <span>{f.q}</span>
                  <span className="text-gray-400 ml-2 flex-shrink-0">{openFaq===i ? '▲' : '▾'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3 text-sm text-gray-500 leading-relaxed border-t border-gray-50">{f.r}</div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setOnglet('chat')} className="w-full mt-4 py-3 rounded-xl text-white font-medium text-sm" style={{background:'#FF80B5'}}>
            Poser une question au chat →
          </button>
        </div>
      )}
    </div>
  )
}
