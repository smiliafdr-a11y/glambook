'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

const STATUT_COLORS: Record<string, string> = {
  confirme: 'bg-pink-50 text-pink-700',
  en_attente: 'bg-yellow-50 text-yellow-700',
  termine: 'bg-green-50 text-green-700',
  annule: 'bg-gray-100 text-gray-400',
}
const STATUT_LABELS: Record<string, string> = {
  confirme: 'Confirmé', en_attente: 'En attente', termine: 'Terminé', annule: 'Annulé',
}

export default function AgendaPage() {
  const today = new Date()
  const [curYear, setCurYear] = useState(today.getFullYear())
  const [curMonth, setCurMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [rdvs, setRdvs] = useState<any[]>([])
  const [rdvsJour, setRdvsJour] = useState<any[]>([])
  const [prestations, setPrestations] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [prestataireId, setPrestataireId] = useState('')
  const [showModal, setShowModal] = useState(false)

  // MODE MODAL : 'existante' ou 'rapide'
  const [modeCliente, setModeCliente] = useState<'existante'|'rapide'>('existante')
  const [formRdv, setFormRdv] = useState({
    cliente_id: '',
    // Mode rapide
    prenom: '', telephone: '',
    // Commun
    prestation_id: '', heure: '10:00', notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pres } = await supabase.from('prestataires').select('id').eq('user_id', user.id).single()
    if (!pres) return
    setPrestataireId(pres.id)
    loadRdvsMois(pres.id, today.getFullYear(), today.getMonth())
    loadPrestations(pres.id)
    loadClientes(pres.id)
  }

  const loadRdvsMois = useCallback(async (pid: string, y: number, m: number) => {
    const start = `${y}-${String(m+1).padStart(2,'0')}-01`
    const end = `${y}-${String(m+1).padStart(2,'0')}-${new Date(y,m+1,0).getDate()}`
    const { data } = await supabase.from('rendez_vous')
      .select('*, cliente:clientes(nom,prenom), prestation:prestations(nom,duree_minutes)')
      .eq('prestataire_id', pid).gte('date_rdv', start).lte('date_rdv', end)
    setRdvs(data || [])
    filterJour(data || [], y, m, selectedDay)
  }, [selectedDay])

  function filterJour(all: any[], y: number, m: number, d: number) {
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    setRdvsJour(all.filter(r => r.date_rdv === key).sort((a,b) => a.heure_debut.localeCompare(b.heure_debut)))
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
    const key = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return rdvs.filter(r => r.date_rdv === key)
  }

  async function saveRdv() {
    const prest = prestations.find(p => p.id === formRdv.prestation_id)
    if (!prest) return
    if (modeCliente === 'existante' && !formRdv.cliente_id) return
    if (modeCliente === 'rapide' && !formRdv.prenom) return

    setSaving(true)

    let clienteId = formRdv.cliente_id

    // Mode rapide — créer ou retrouver la cliente par téléphone
    if (modeCliente === 'rapide') {
      if (formRdv.telephone) {
        const { data: existing } = await supabase.from('clientes')
          .select('id').eq('telephone', formRdv.telephone).eq('prestataire_id', prestataireId).maybeSingle()
        if (existing) {
          clienteId = existing.id
        } else {
          const { data: newC } = await supabase.from('clientes').insert({
            prestataire_id: prestataireId,
            prenom: formRdv.prenom,
            telephone: formRdv.telephone,
            premiere_visite: new Date().toISOString().split('T')[0],
          }).select().single()
          clienteId = newC?.id || ''
        }
      } else {
        // Sans téléphone — créer une cliente temporaire
        const { data: newC } = await supabase.from('clientes').insert({
          prestataire_id: prestataireId,
          prenom: formRdv.prenom,
          nom: '',
          premiere_visite: new Date().toISOString().split('T')[0],
        }).select().single()
        clienteId = newC?.id || ''
      }
    }

    const [h, min] = formRdv.heure.split(':').map(Number)
    const totalMin = h*60 + min + prest.duree_minutes
    const hFin = `${String(Math.floor(totalMin/60)).padStart(2,'0')}:${String(totalMin%60).padStart(2,'0')}`
    const dateStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`

    await supabase.from('rendez_vous').insert({
      prestataire_id: prestataireId,
      cliente_id: clienteId,
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
    setFormRdv({ cliente_id:'', prenom:'', telephone:'', prestation_id:'', heure:'10:00', notes:'' })
    loadRdvsMois(prestataireId, curYear, curMonth)
    loadClientes(prestataireId)
  }

  async function updateStatut(rdvId: string, statut: string) {
    await supabase.from('rendez_vous').update({ statut }).eq('id', rdvId)
    loadRdvsMois(prestataireId, curYear, curMonth)
  }

  const firstDay = new Date(curYear, curMonth, 1).getDay()
  const daysInMonth = new Date(curYear, curMonth+1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const prevDays = new Date(curYear, curMonth, 0).getDate()
  const selectedDateLabel = new Date(curYear, curMonth, selectedDay).toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long'})
  const caJour = rdvsJour.filter(r => r.statut !== 'annule').reduce((s,r) => s+(r.prix_total||0), 0)

  const canSave = formRdv.prestation_id && (
    (modeCliente === 'existante' && formRdv.cliente_id) ||
    (modeCliente === 'rapide' && formRdv.prenom)
  )

  return (
    <div className="flex h-full">
      {/* CALENDRIER */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50">‹</button>
            <h2 className="text-base font-bold text-gray-900 min-w-[140px] text-center">{MONTHS[curMonth]} {curYear}</h2>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50">›</button>
            <button onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); setSelectedDay(today.getDate()) }}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 ml-1">Aujourd'hui</button>
          </div>
          <button onClick={() => setShowModal(true)} className="text-white text-sm px-4 py-2 rounded-lg font-medium" style={{background:'#FF80B5'}}>
            + Nouveau RDV
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d,i) => <div key={d} className={`text-center text-xs font-semibold py-1 ${i >= 5 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({length: startOffset}).map((_,i) => (
            <div key={`p${i}`} className="min-h-[80px] bg-gray-50 rounded-lg p-1.5 opacity-40">
              <div className="text-xs text-gray-400">{prevDays - startOffset + 1 + i}</div>
            </div>
          ))}
          {Array.from({length: daysInMonth}).map((_,i) => {
            const d = i+1
            const dayRdvs = rdvsForDay(d)
            const isToday = d === today.getDate() && curMonth === today.getMonth() && curYear === today.getFullYear()
            const isSelected = d === selectedDay
            const isSun = new Date(curYear, curMonth, d).getDay() === 0
            return (
              <div key={d} onClick={() => selectDay(d)}
                className="min-h-[80px] rounded-lg p-1.5 cursor-pointer transition-all border"
                style={{
                  background: isSelected ? '#fff5f9' : 'white',
                  borderColor: isSelected ? '#FF80B5' : isToday ? '#ffd0e8' : '#f3f4f6',
                  borderWidth: isSelected || isToday ? '2px' : '1px',
                }}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${isSun ? 'text-red-400' : 'text-gray-600'} ${isToday ? 'w-5 h-5 rounded-full text-white flex items-center justify-center text-xs' : ''}`}
                    style={isToday ? {background:'#FF80B5'} : {}}>
                    {d}
                  </span>
                  {dayRdvs.length > 0 && <span className="text-xs font-bold" style={{color:'#FF80B5'}}>{dayRdvs.length}</span>}
                </div>
                {isSun ? <div className="text-xs text-gray-300">Fermé</div> : (
                  dayRdvs.slice(0,2).map(r => (
                    <div key={r.id} className={`text-xs px-1 py-0.5 rounded mb-0.5 truncate ${STATUT_COLORS[r.statut] || 'bg-gray-50 text-gray-500'}`}>
                      {r.heure_debut?.slice(0,5)} {(r.cliente as any)?.prenom}
                    </div>
                  ))
                )}
                {dayRdvs.length > 2 && <div className="text-xs font-medium" style={{color:'#FF80B5'}}>+{dayRdvs.length - 2}</div>}
              </div>
            )
          })}
          {Array.from({length: (7 - (startOffset + daysInMonth) % 7) % 7}).map((_,i) => (
            <div key={`n${i}`} className="min-h-[80px] bg-gray-50 rounded-lg p-1.5 opacity-40">
              <div className="text-xs text-gray-400">{i+1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PANNEAU DÉTAIL */}
      <div className="w-64 xl:w-72 border-l border-gray-100 bg-white flex flex-col overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="font-semibold text-gray-900 capitalize text-sm">{selectedDateLabel}</div>
          <div className="text-xs text-gray-400 mt-0.5">{rdvsJour.length} RDV · {caJour} € prévus</div>
          {rdvsJour.length > 0 && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1 rounded-lg p-2 text-center bg-gray-50">
                <div className="text-base font-bold" style={{color:'#FF80B5'}}>{rdvsJour.length}</div>
                <div className="text-xs text-gray-400">RDV</div>
              </div>
              <div className="flex-1 rounded-lg p-2 text-center bg-gray-50">
                <div className="text-base font-bold text-green-600">{caJour} €</div>
                <div className="text-xs text-gray-400">CA</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-3 space-y-2">
          {rdvsJour.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">✨</div>
              <p className="text-xs">Aucun RDV</p>
              <button onClick={() => setShowModal(true)} className="mt-2 text-xs hover:underline" style={{color:'#FF80B5'}}>+ Ajouter</button>
            </div>
          ) : (
            rdvsJour.map(rdv => (
              <div key={rdv.id} className="border border-gray-100 rounded-xl p-3">
                <div className="text-xs font-bold mb-1" style={{color:'#FF80B5'}}>{rdv.heure_debut?.slice(0,5)} – {rdv.heure_fin?.slice(0,5)}</div>
                <div className="font-semibold text-sm text-gray-900">{(rdv.cliente as any)?.prenom} {(rdv.cliente as any)?.nom}</div>
                <div className="text-xs text-gray-400">{(rdv.prestation as any)?.nom} · {rdv.prix_total} €</div>
                {rdv.acompte_paye && <div className="text-xs text-green-600 mt-0.5">Acompte ✓</div>}
                {rdv.notes && <div className="text-xs text-gray-400 bg-gray-50 rounded p-1.5 mt-1.5 border-l-2" style={{borderColor:'#FF80B5'}}>{rdv.notes}</div>}
                <div className="flex gap-1 mt-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUT_COLORS[rdv.statut]}`}>{STATUT_LABELS[rdv.statut]}</span>
                </div>
                {rdv.statut !== 'termine' && rdv.statut !== 'annule' && (
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => updateStatut(rdv.id,'termine')} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">✓ Terminer</button>
                    <button onClick={() => updateStatut(rdv.id,'annule')} className="text-xs px-2 py-1 bg-red-50 text-red-400 rounded-lg hover:bg-red-100">Annuler</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-100">
          <button onClick={() => setShowModal(true)} className="w-full text-white text-sm py-2.5 rounded-lg font-medium" style={{background:'#FF80B5'}}>
            + Ajouter un RDV
          </button>
        </div>
      </div>

      {/* MODAL NOUVEAU RDV */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if(e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{background:'#FF80B5'}}>
              <h3 className="text-white font-semibold">Nouveau rendez-vous</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-5 space-y-4">

              {/* TOGGLE MODE CLIENTE */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Cliente</label>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-3">
                  <button onClick={() => setModeCliente('existante')}
                    className="flex-1 py-2 text-xs font-medium transition-colors"
                    style={{background: modeCliente==='existante' ? '#FF80B5' : 'white', color: modeCliente==='existante' ? 'white' : '#9ca3af'}}>
                    📋 Cliente existante
                  </button>
                  <button onClick={() => setModeCliente('rapide')}
                    className="flex-1 py-2 text-xs font-medium transition-colors"
                    style={{background: modeCliente==='rapide' ? '#FF80B5' : 'white', color: modeCliente==='rapide' ? 'white' : '#9ca3af'}}>
                    ⚡ Ajout rapide
                  </button>
                </div>

                {modeCliente === 'existante' ? (
                  <select value={formRdv.cliente_id} onChange={e => setFormRdv(f=>({...f,cliente_id:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-300">
                    <option value="">Choisir une cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input value={formRdv.prenom} onChange={e => setFormRdv(f=>({...f,prenom:e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-300"
                      placeholder="Prénom *" />
                    <input type="tel" value={formRdv.telephone} onChange={e => setFormRdv(f=>({...f,telephone:e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-300"
                      placeholder="Téléphone (optionnel)" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Prestation</label>
                <select value={formRdv.prestation_id} onChange={e => setFormRdv(f=>({...f,prestation_id:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-300">
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
                  <input type="time" value={formRdv.heure} onChange={e => setFormRdv(f=>({...f,heure:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-300" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Note interne</label>
                <textarea value={formRdv.notes} onChange={e => setFormRdv(f=>({...f,notes:e.target.value}))}
                  rows={2} placeholder="Allergies, préférences, remarques..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none focus:border-pink-300" />
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm">Annuler</button>
              <button onClick={saveRdv} disabled={saving || !canSave}
                className="flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-40"
                style={{background:'#FF80B5'}}>
                {saving ? 'Création...' : 'Créer le RDV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
