'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cliente, JournalPrestation } from '@/types'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [journal, setJournal] = useState<JournalPrestation[]>([])
  const [prestataireId, setPrestataireId] = useState('')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCliente, setNewCliente] = useState({ prenom: '', nom: '', email: '', telephone: '', allergies: '', notes_privees: '' })
  const [editNote, setEditNote] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pres } = await supabase.from('prestataires').select('id').eq('user_id', user.id).single()
    if (!pres) return
    setPrestataireId(pres.id)
    loadClientes(pres.id)
  }

  async function loadClientes(pid: string) {
    const { data } = await supabase.from('clientes').select('*').eq('prestataire_id', pid).order('prenom')
    setClientes(data || [])
  }

  async function selectCliente(c: Cliente) {
    setSelected(c)
    setEditNote(c.notes_privees || '')
    const { data } = await supabase.from('journal_prestations').select('*').eq('cliente_id', c.id).order('date_prestation', { ascending: false })
    setJournal(data || [])
  }

  async function saveNotes() {
    if (!selected) return
    await supabase.from('clientes').update({ notes_privees: editNote }).eq('id', selected.id)
    setSelected({ ...selected, notes_privees: editNote })
    setEditingNotes(false)
    loadClientes(prestataireId)
  }

  async function addCliente() {
    if (!newCliente.prenom || !newCliente.nom) return
    const { data } = await supabase.from('clientes').insert({
      prestataire_id: prestataireId,
      ...newCliente,
      premiere_visite: new Date().toISOString().split('T')[0],
    }).select().single()
    if (data) {
      loadClientes(prestataireId)
      setShowAddModal(false)
      setNewCliente({ prenom: '', nom: '', email: '', telephone: '', allergies: '', notes_privees: '' })
    }
  }

  const filtered = clientes.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full">
      {/* LISTE */}
      <div className="w-72 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Clientes ({clientes.length})</h2>
            <button onClick={() => setShowAddModal(true)} className="text-xs bg-pink-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600">+ Ajouter</button>
          </div>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => (
            <button key={c.id} onClick={() => selectCliente(c)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-pink-50 border-r-2 border-brand-500' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm flex-shrink-0">
                  {c.prenom[0]}{c.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{c.prenom} {c.nom}</div>
                  <div className="text-xs text-gray-400">{c.nb_prestations} prestations · {c.ca_total} €</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FICHE CLIENTE */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-sm">Sélectionnez une cliente pour voir sa fiche</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            {/* Header fiche */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl">
                  {selected.prenom[0]}{selected.nom[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selected.prenom} {selected.nom}</h2>
                  <div className="text-sm text-gray-400 mt-0.5">
                    Cliente depuis {selected.premiere_visite ? new Date(selected.premiere_visite).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'inconnue'}
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="text-center"><div className="font-bold text-gray-900">{selected.nb_prestations}</div><div className="text-xs text-gray-400">Prestations</div></div>
                    <div className="text-center"><div className="font-bold text-brand-500">{selected.ca_total} €</div><div className="text-xs text-gray-400">CA total</div></div>
                    {selected.telephone && <div className="text-sm text-gray-500 flex items-center gap-1">📞 {selected.telephone}</div>}
                    {selected.email && <div className="text-sm text-gray-500 flex items-center gap-1">✉️ {selected.email}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Allergies */}
            {selected.allergies && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="font-semibold text-red-700 text-sm mb-1">⚠️ Allergies / Contre-indications</div>
                <div className="text-sm text-red-600">{selected.allergies}</div>
              </div>
            )}

            {/* Notes privées */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">📝 Notes privées</h3>
                {!editingNotes ? (
                  <button onClick={() => setEditingNotes(true)} className="text-xs text-brand-500 hover:underline">Modifier</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingNotes(false)} className="text-xs text-gray-400 hover:text-gray-600">Annuler</button>
                    <button onClick={saveNotes} className="text-xs text-brand-500 font-semibold hover:underline">Sauvegarder</button>
                  </div>
                )}
              </div>
              {editingNotes ? (
                <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                  placeholder="Préférences, comportements, ce qui fonctionne bien..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none" />
              ) : (
                <div className={`text-sm ${selected.notes_privees ? 'text-gray-600 leading-relaxed' : 'text-gray-300 italic'}`}>
                  {selected.notes_privees || 'Aucune note. Cliquez sur Modifier pour en ajouter.'}
                </div>
              )}
            </div>

            {/* Historique prestations */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">📋 Historique des prestations</h3>
              {journal.length === 0 ? (
                <div className="text-sm text-gray-400 italic">Aucune prestation enregistrée.</div>
              ) : (
                <div className="space-y-3">
                  {journal.map(j => (
                    <div key={j.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
                      <div className="text-xs text-gray-400 min-w-[80px] pt-0.5">
                        {j.date_prestation ? new Date(j.date_prestation).toLocaleDateString('fr-FR') : ''}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{j.prestation_nom}</div>
                        {j.notes_prestataire && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-1 border-l-2 border-brand-300 leading-relaxed">
                            {j.notes_prestataire}
                          </div>
                        )}
                        {j.recommandations && (
                          <div className="text-xs text-blue-600 mt-1">💡 {j.recommandations}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL AJOUT CLIENTE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-pink-500 px-5 py-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">Nouvelle cliente</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Prénom *</label>
                  <input value={newCliente.prenom} onChange={e => setNewCliente(f => ({ ...f, prenom: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="Amina" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nom *</label>
                  <input value={newCliente.nom} onChange={e => setNewCliente(f => ({ ...f, nom: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="Benali" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                <input type="email" value={newCliente.email} onChange={e => setNewCliente(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="amina@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone</label>
                <input value={newCliente.telephone} onChange={e => setNewCliente(f => ({ ...f, telephone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="06 XX XX XX XX" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Allergies / Contre-indications</label>
                <input value={newCliente.allergies} onChange={e => setNewCliente(f => ({ ...f, allergies: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="ex: allergie gel UV" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Note initiale</label>
                <textarea value={newCliente.notes_privees} onChange={e => setNewCliente(f => ({ ...f, notes_privees: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none"
                  placeholder="Préférences, remarques..." />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm">Annuler</button>
              <button onClick={addCliente} disabled={!newCliente.prenom || !newCliente.nom}
                className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-40">
                Ajouter la cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
