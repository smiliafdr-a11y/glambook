'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Prestation } from '@/types'

const CATEGORIES = ['Ongles', 'Cheveux', 'Soin', 'Maquillage', 'Épilation', 'Autre']

export default function PrestationsPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [prestataireId, setPrestataireId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Prestation | null>(null)
  const [form, setForm] = useState({ nom: '', description: '', duree_minutes: 60, prix: 0, acompte: 0, categorie: 'Ongles' })
  const [saving, setSaving] = useState(false)

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
    const { data } = await supabase.from('prestations').select('*').eq('prestataire_id', pid).order('categorie').order('nom')
    setPrestations(data || [])
  }

  function openAdd() {
    setEditing(null)
    setForm({ nom: '', description: '', duree_minutes: 60, prix: 0, acompte: 0, categorie: 'Ongles' })
    setShowModal(true)
  }

  function openEdit(p: Prestation) {
    setEditing(p)
    setForm({ nom: p.nom, description: p.description || '', duree_minutes: p.duree_minutes, prix: p.prix, acompte: p.acompte, categorie: p.categorie })
    setShowModal(true)
  }

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('prestations').update(form).eq('id', editing.id)
    } else {
      await supabase.from('prestations').insert({ ...form, prestataire_id: prestataireId })
    }
    setSaving(false)
    setShowModal(false)
    load(prestataireId)
  }

  async function toggleActif(p: Prestation) {
    await supabase.from('prestations').update({ actif: !p.actif }).eq('id', p.id)
    load(prestataireId)
  }

  const categories = Array.from(new Set(prestations.map(p => p.categorie)))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes prestations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{prestations.length} prestations configurées</p>
        </div>
        <button onClick={openAdd} className="bg-brand-500 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-brand-600">
          + Nouvelle prestation
        </button>
      </div>

      {prestations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">✂️</div>
          <h3 className="font-semibold text-gray-900 mb-2">Aucune prestation</h3>
          <p className="text-sm text-gray-400 mb-4">Ajoutez vos prestations pour que les clientes puissent réserver.</p>
          <button onClick={openAdd} className="bg-brand-500 text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600">
            Ajouter ma première prestation
          </button>
        </div>
      ) : (
        categories.map(cat => (
          <div key={cat} className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {prestations.filter(p => p.categorie === cat).map(p => (
                <div key={p.id} className={`bg-white rounded-xl border p-4 ${p.actif ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-900 text-sm">{p.nom}</div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="text-xs text-gray-400 hover:text-brand-500 px-2 py-0.5 rounded">✏️</button>
                      <button onClick={() => toggleActif(p)} className={`text-xs px-2 py-0.5 rounded ${p.actif ? 'text-green-600 hover:text-red-500' : 'text-gray-400 hover:text-green-600'}`}>
                        {p.actif ? '✓' : '○'}
                      </button>
                    </div>
                  </div>
                  {p.description && <p className="text-xs text-gray-400 mb-2">{p.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">⏱ {p.duree_minutes < 60 ? `${p.duree_minutes}min` : `${Math.floor(p.duree_minutes / 60)}h${p.duree_minutes % 60 ? (p.duree_minutes % 60) + 'min' : ''}`}</div>
                    <div className="text-right">
                      <div className="font-bold text-brand-500">{p.prix} €</div>
                      {p.acompte > 0 && <div className="text-xs text-gray-400">Acompte {p.acompte} €</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-brand-500 px-5 py-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">{editing ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nom *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="ex: Pose gel couleur" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Catégorie</label>
                <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none"
                  placeholder="Description courte pour les clientes..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Durée (min)</label>
                  <input type="number" value={form.duree_minutes} onChange={e => setForm(f => ({ ...f, duree_minutes: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" min={15} step={15} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Prix (€)</label>
                  <input type="number" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" min={0} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Acompte (€)</label>
                  <input type="number" value={form.acompte} onChange={e => setForm(f => ({ ...f, acompte: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" min={0} />
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm">Annuler</button>
              <button onClick={save} disabled={saving || !form.nom}
                className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-40">
                {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
