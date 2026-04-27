'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RendezVous, Prestation, Cliente } from '@/types'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const STATUT_COLORS: Record<string, string> = {
  confirme: 'bg-orange-100 text-orange-700',
  en_attente: 'bg-yellow-100 text-yellow-700',
  termine: 'bg-green-100 text-green-700',
  annule: 'bg-gray-100 text-gray-400',
  no_show: 'bg-red-100 text-red-500',
}

export default function AgendaPage() {
  const today = new Date()
  const [curYear, setCurYear] = useState(today.getFullYear())
  const [curMonth, setCurMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [rdvs, setRdvs] = useState<RendezVous[]>([])
  const [rdvsJour, setRdvsJour] = useState<RendezVous[]>([])
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [prestataireId, setPrestataireId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [formRdv, setFormRdv] = useState({ cliente_id: '', prestation_id: '', heure: '10:00', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pres } = await supabase.from('prestataires').select('id').eq('user_id', user.id).single()
    if (!pres) return
    setPrestataireId(pres.id)
    loadRdvsMois(pres.id, curYear, curMonth)
    loadPrestations(pres.id)
    loadClientes(pres.id)
  }

  const loadRdvsMois = useCallback(async (pid: string, y: number, m: number) => {
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const end = `${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`
    const { data } = await supabase
      .from('rendez_vous')
      .select('*, cliente:clientes(nom, prenom), prestation:prestations(nom, duree_minutes)')
      .eq('prestataire_id', pid)
      .gte('date_rdv', start)
      .lte('date_rdv', end)
    setRdvs(data || [])
    filterJour(data || [], y, m, selectedDay)
  }, [selectedDay])

  function filterJour(all: RendezVous[], y: number, m: number, d: number) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    setRdvsJour(all.filter(r => r.date_rdv === key).sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)))
  }

  async function loadPrestations(pid: string) {
    const { data } = await supabase.from('prestations').select('*').eq('prestataire_id', pid).eq('actif', true)
    setPrestations(data || [])
  }

  async function loadClientes(pid: string) {
    const { data } = await supabase.from('clientes').select('*').eq('prestataire_id', pid).order('prenom')
    setClientes(data || [])
  }

  function changeMonth(dir: number) {
    let m = curMonth + dir, y = curYear
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setCurMonth(m); setCurYear(y)
    if (prestataireId) loadRdvsMois(prestataireId, y, m)
  }

  function selectDay(d: number) {
    setSelectedDay(d)
    filterJour(rdvs, curYear, curMonth, d)
  }

  function rdvsForDay(d: number) {
    const key = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return rdvs.filter(r => r.date_rdv === key)
  }

  async function saveRdv() {
    if (!formRdv.cliente_id || !formRdv.prestation_id) return
    setSaving(true)
    const prest = prestations.find(p => p.id === formRdv.prestation_id)
    if (!prest) return
    const [h, min] = formRdv.heure.split(':').map(Number)
    const totalMin = h * 60 + min + prest.duree_minutes
    const hFin = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
    const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

    await supabase.from('rendez_vous').insert({
      prestataire_id: prestataireId,
      cliente_id: formRdv.cliente_id,
      prestation_id: formRdv.prestation_id,
      date_rdv: dateStr,
      heure_debut: formRdv.heure,
      heure_fin: hFin,
      statut: 'confirme',
      prix_total: prest.prix,
      acompte_montant: prest.acompte,
      notes: formRdv.notes,
    })

    setSaving(false)
    setShowModal(false)
    setFormRdv({ cliente_id: '', prestation_id: '', heure: '10:00', notes: '' })
    loadRdvsMois(prestataireId, curYear, curMonth)
  }

  async function updateStatut(rdvId: string, statut: string) {
    await supabase.from('rendez_vous').update({ statut }).eq('id', rdvId)
    loadRdvsMois(prestataireId, curYear, curMonth)
  }

  // Calendrier
  const firstDay = new Date(curYear, curMonth, 1).getDay()
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const prevDays = new Date(curYear, curMonth, 0).getDate()

  const selectedDateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  const selectedDateLabel = new Date(curYear, curMonth, selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const caJour = rdvsJour.filter(r => r.statut !== 'annule').reduce((s, r) => s + (r.prix_total || 0), 0)

  return (
    <div className="flex h-full">
      {/* CALENDRIER */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50">‹</button>
            <h2 className="text-lg font-bold text-gray-900 min-w-[180px] text-center">{MONTHS[curMonth]} {curYear}</h2>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50">›</button>
            <button onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); setSelectedDay(today.getDate()); }} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 ml-1">Aujourd'hui</button>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-pink-500 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-brand-600 transition-colors">
            + Nouveau RDV
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-2 ${i >= 5 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-1">
          {/* Jours mois précédent */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`prev-${i}`} className="min-h-[90px] bg-gray-50 rounded-lg p-2 opacity-40">
              <div className="text-xs text-gray-400">{prevDays - startOffset + 1 + i}</div>
            </div>
          ))}
          {/* Jours du mois */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1
            const dayRdvs = rdvsForDay(d)
            const isToday = d === today.getDate() && curMonth === today.getMonth() && curYear === today.getFullYear()
            const isSelected = d === selectedDay
            const isSunday = new Date(curYear, curMonth, d).getDay() === 0
            return (
              <div
                key={d}
                onClick={() => selectDay(d)}
                className={`min-h-[90px] rounded-lg p-2 cursor-pointer transition-all border ${
                  isSelected ? 'border-brand-500 bg-pink-50' :
                  isToday ? 'border-brand-300 bg-white' :
                  'border-transparent bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${isToday ? 'bg-pink-500 text-white w-5 h-5 rounded-full flex items-center justify-center' : isSunday ? 'text-red-400' : 'text-gray-600'}`}>
                    {d}
                  </span>
                  {dayRdvs.length > 0 && (
                    <span className="text-xs text-brand-500 font-medium">{dayRdvs.length}</span>
                  )}
                </div>
                {isSunday ? (
                  <div className="text-xs text-gray-300 mt-1">Fermé</div>
                ) : (
                  dayRdvs.slice(0, 2).map(r => (
                    <div key={r.id} className={`text-xs px-1.5 py-0.5 rounded mb-0.5 truncate ${STATUT_COLORS[r.statut]}`}>
                      {r.heure_debut.slice(0, 5)} {(r.cliente as any)?.prenom}
                    </div>
                  ))
                )}
                {dayRdvs.length > 2 && <div className="text-xs text-brand-400 font-medium">+{dayRdvs.length - 2}</div>}
              </div>
            )
          })}
          {/* Jours mois suivant */}
          {Array.from({ length: (7 - (startOffset + daysInMonth) % 7) % 7 }).map((_, i) => (
            <div key={`next-${i}`} className="min-h-[90px] bg-gray-50 rounded-lg p-2 opacity-40">
              <div className="text-xs text-gray-400">{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PANNEAU DÉTAIL DU JOUR */}
      <div className="w-72 border-l border-gray-100 bg-white flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="font-semibold text-gray-900 capitalize text-sm">{selectedDateLabel}</div>
          <div className="text-xs text-gray-400 mt-0.5">{rdvsJour.length} RDV · CA prévu {caJour} €</div>
          {rdvsJour.length > 0 && (
            <div className="flex gap-2 mt-3">
              <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-brand-500">{rdvsJour.length}</div>
                <div className="text-xs text-gray-400">RDV</div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-green-600">{caJour} €</div>
                <div className="text-xs text-gray-400">CA</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 space-y-3">
          {rdvsJour.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">✨</div>
              <p className="text-xs">Aucun RDV ce jour</p>
              <button onClick={() => setShowModal(true)} className="mt-3 text-xs text-brand-500 hover:underline">+ Ajouter</button>
            </div>
          ) : (
            rdvsJour.map(rdv => (
              <div key={rdv.id} className="border border-gray-100 rounded-xl p-3">
                <div className="text-xs font-bold text-brand-500">{rdv.heure_debut.slice(0, 5)} – {rdv.heure_fin.slice(0, 5)}</div>
                <div className="font-semibold text-sm text-gray-900 mt-1">
                  {(rdv.cliente as any)?.prenom} {(rdv.cliente as any)?.nom}
                </div>
                <div className="text-xs text-gray-400">{(rdv.prestation as any)?.nom} · {rdv.prix_total} €</div>
                {rdv.acompte_paye && (
                  <div className="text-xs text-green-600 mt-0.5">Acompte {rdv.acompte_montant} € ✓</div>
                )}
                {rdv.notes && (
                  <div className="text-xs text-gray-400 bg-gray-50 rounded p-1.5 mt-1.5 border-l-2 border-brand-300">{rdv.notes}</div>
                )}
                <div className="flex gap-1 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[rdv.statut]}`}>
                    {rdv.statut === 'confirme' ? 'Confirmé' : rdv.statut === 'en_attente' ? 'En attente' : rdv.statut === 'termine' ? 'Terminé' : 'Annulé'}
                  </span>
                </div>
                {rdv.statut !== 'termine' && rdv.statut !== 'annule' && (
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => updateStatut(rdv.id, 'termine')} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Terminer</button>
                    <button onClick={() => updateStatut(rdv.id, 'annule')} className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">Annuler</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => setShowModal(true)} className="w-full bg-pink-500 text-white text-sm py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors">
            + Ajouter un RDV
          </button>
        </div>
      </div>

      {/* MODAL NOUVEAU RDV */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-pink-500 px-5 py-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">Nouveau rendez-vous</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Cliente</label>
                <select value={formRdv.cliente_id} onChange={e => setFormRdv(f => ({ ...f, cliente_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500">
                  <option value="">Choisir une cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Prestation</label>
                <select value={formRdv.prestation_id} onChange={e => setFormRdv(f => ({ ...f, prestation_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500">
                  <option value="">Choisir une prestation...</option>
                  {prestations.map(p => <option key={p.id} value={p.id}>{p.nom} — {p.prix} € ({p.duree_minutes}min)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                  <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-gray-50">
                    {selectedDay} {MONTHS[curMonth]} {curYear}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Heure</label>
                  <input type="time" value={formRdv.heure} onChange={e => setFormRdv(f => ({ ...f, heure: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Note interne</label>
                <textarea value={formRdv.notes} onChange={e => setFormRdv(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Allergies, préférences, remarques..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none" />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
              <button onClick={saveRdv} disabled={saving || !formRdv.cliente_id || !formRdv.prestation_id}
                className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-40">
                {saving ? 'Enregistrement...' : 'Créer le RDV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
