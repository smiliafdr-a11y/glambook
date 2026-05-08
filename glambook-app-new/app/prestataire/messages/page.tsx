'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function MessagesPage() {
  const [prestataireId, setPrestataireId] = useState('')
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pres } = await supabase.from('prestataires').select('id').eq('user_id', user.id).single()
    if (!pres) return
    setPrestataireId(pres.id)
    loadConversations(pres.id)

    // Realtime
    supabase.channel('dashboard-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `prestataire_id=eq.${pres.id}` },
        () => loadConversations(pres.id))
      .subscribe()
  }

  async function loadConversations(presId: string) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, cliente:clientes(id,prenom,nom)')
      .eq('prestataire_id', presId)
      .order('created_at', { ascending: false })

    if (!msgs) return

    // Grouper par cliente — dernière conversation
    const seen = new Set()
    const convs: any[] = []
    for (const m of msgs) {
      const cid = (m.cliente as any)?.id
      if (!seen.has(cid)) {
        seen.add(cid)
        const unread = msgs.filter(x => (x.cliente as any)?.id === cid && x.expediteur === 'cliente' && !x.lu).length
        convs.push({ cliente: m.cliente, dernierMsg: m, unread })
      }
    }
    setConversations(convs)
  }

  async function selectConversation(conv: any) {
    setSelectedCliente(conv.cliente)
    await loadMessages(conv.cliente.id)
    // Marquer comme lus
    await supabase.from('messages').update({ lu: true })
      .eq('prestataire_id', prestataireId)
      .eq('cliente_id', conv.cliente.id)
      .eq('expediteur', 'cliente')
    loadConversations(prestataireId)
  }

  async function loadMessages(clienteId: string) {
    const { data } = await supabase.from('messages').select('*')
      .eq('prestataire_id', prestataireId)
      .eq('cliente_id', clienteId)
      .order('created_at')
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function sendMessage() {
    const txt = newMsg.trim()
    if (!txt || !selectedCliente || sending) return
    setSending(true)
    setNewMsg('')
    await supabase.from('messages').insert({
      prestataire_id: prestataireId,
      cliente_id: selectedCliente.id,
      expediteur: 'prestataire',
      contenu: txt,
      lu: false,
    })
    await loadMessages(selectedCliente.id)
    setSending(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* LISTE CONVERSATIONS */}
      <div style={{background:'var(--card)'}}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Messages</h2>
          <p className="text-xs mt-0.5">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-10 text-sm">Aucun message</div>
          ) : (
            conversations.map(conv => (
              <button key={conv.cliente?.id} onClick={() => selectConversation(conv)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-theme2 transition-colors ${selectedCliente?.id === conv.cliente?.id ? 'bg-brand-50 border-r-2' : ''}`}
                style={selectedCliente?.id === conv.cliente?.id ? {borderRightColor:'var(--accent)'} : {}}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{background:'var(--accent)'}}>
                    {conv.cliente?.prenom?.[0]}{conv.cliente?.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-sm">{conv.cliente?.prenom} {conv.cliente?.nom}</div>
                      {conv.unread > 0 && (
                        <span className="text-xs text-white px-1.5 py-0.5 rounded-full font-bold" style={{background:'var(--accent)'}}>{conv.unread}</span>
                      )}
                    </div>
                    <div className="text-xs truncate mt-0.5">{conv.dernierMsg?.contenu}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedCliente ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm">Sélectionnez une conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div style={{background:'var(--card)'}}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{background:'var(--accent)'}}>
                {selectedCliente?.prenom?.[0]}{selectedCliente?.nom?.[0]}
              </div>
              <div>
                <div className="font-semibold text-sm">{selectedCliente?.prenom} {selectedCliente?.nom}</div>
                <div className="text-xs text-green-500">Cliente</div>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{background:'var(--bg2)'}}>
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.expediteur === 'prestataire' ? 'justify-end' : 'justify-start'}`}>
                  <div style={{maxWidth:'70%'}}>
                    <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: m.expediteur === 'prestataire' ? 'var(--accent)' : 'white',
                        color: m.expediteur === 'prestataire' ? 'white' : '#333',
                        borderBottomRightRadius: m.expediteur === 'prestataire' ? 4 : 16,
                        borderBottomLeftRadius: m.expediteur === 'cliente' ? 4 : 16,
                        border: m.expediteur === 'cliente' ? '1px solid #eee' : 'none',
                      }}>
                      {m.contenu}
                    </div>
                    <div className="text-xs text-gray-300 mt-0.5 px-1">
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}
                      {m.expediteur === 'prestataire' && <span className="ml-1">{m.lu ? '✓✓' : '✓'}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef}/>
            </div>

            {/* RÉPONSES RAPIDES */}
            <div style={{background:'var(--card)'}} style={{scrollbarWidth:'none'}}>
              {["Bonjour ! 😊", "Oui bien sûr !", "Je vous rappelle.", "C'est noté ✓", "À bientôt !"].map(r => (
                <button key={r} onClick={() => setNewMsg(r)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border"
                  style={{borderColor:'var(--accent-mid)', color:'var(--accent)', whiteSpace:'nowrap'}}>
                  {r}
                </button>
              ))}
            </div>

            {/* INPUT */}
            <div style={{background:'var(--card)'}}>
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }}}
                placeholder="Répondre à la cliente..."
                className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-pink-300"
              />
              <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                style={{background:'var(--accent)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
