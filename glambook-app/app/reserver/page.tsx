'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function ReserverSansComptePage() {
  const today = new Date()
  const [step, setStep] = useState(0)
  const [prestataires, setPrestataires] = useState<any[]>([])
  const [selectedPrestataire, setSelectedPrestataire] = useState<any>(null)
  const [prestations, setPrestations] = useState<any[]>([])
  const [selectedPrestation, setSelectedPrestation] = useState<any>(null)
  const [curYear, setCurYear] = useState(today.getFullYear())
  const [curMonth, setCurMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number|null>(null)
  const [selectedHeure, setSelectedHeure] = useState('')
  const [modePaiement, setModePaiement] = useState<'especes'|'acompte'>('especes')
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '' })
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [rdvsExistants, setRdvsExistants] = useState<any[]>([])

  const CRENEAUX = ['9h00','9h30','10h00','10h30','11h00','11h30','14h00','14h30','15h00','15h30','16h00','16h30','17h00','17h30']

  useEffect(() => { init() }, [])

  async function init() {
    const { data } = await supabase.from('prestataires').select('*').eq('actif', true)
    setPrestataires(data || [])
    if (data && data.length >= 1) {
      setSelectedPrestataire(data[0])
      loadPrestations(data[0].id)
    }
  }

  async function loadPrestations(presId: string) {
    const { data } = await supabase.from('prestations').select('*').eq('prestataire_id', presId).eq('actif', true).order('nom')
    setPrestations(data || [])
  }

  async function loadRdvsMois(presId: string, y: number, m: number) {
    const start = `${y}-${String(m+1).padStart(2,'0')}-01`
    const end = `${y}-${String(m+1).padStart(2,'0')}-${new Date(y,m+1,0).getDate()}`
    const { data } = await supabase.from('rendez_vous').select('date_rdv,heure_debut,heure_fin')
      .eq('prestataire_id', presId).gte('date_rdv', start).lte('date_rdv', end).neq('statut','annule')
    setRdvsExistants(data || [])
  }

  function changeMonth(dir: number) {
    let m = curMonth + dir, y = curYear
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setCurMonth(m); setCurYear(y)
    if (selectedPrestataire) loadRdvsMois(selectedPrestataire.id, y, m)
  }

  function creneauxDispo(d: number) {
    const key = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const rdvsJour = rdvsExistants.filter(r => r.date_rdv === key)
    return CRENEAUX.filter(h => {
      const [hh, mm] = h.replace('h',':').split(':').map(Number)
      const heureMin = hh * 60 + (mm || 0)
      return !rdvsJour.some(r => {
        const [rh, rm] = r.heure_debut.split(':').map(Number)
        return Math.abs(rh * 60 + (rm||0) - heureMin) < (selectedPrestation?.duree_minutes || 60)
      })
    })
  }

  async function confirmerRdv() {
    if (!form.prenom || !form.telephone || !selectedPrestation || !selectedDay) return
    setSaving(true)

    let clienteId = ''
    const { data: existing } = await supabase.from('clientes')
      .select('id').eq('telephone', form.telephone).eq('prestataire_id', selectedPrestataire.id).maybeSingle()

    if (existing) {
      clienteId = existing.id
    } else {
      const { data: newCliente } = await supabase.from('clientes').insert({
        prestataire_id: selectedPrestataire.id,
        prenom: form.prenom,
        nom: form.nom || '',
        telephone: form.telephone,
        premiere_visite: new Date().toISOString().split('T')[0],
      }).select().single()
      clienteId = newCliente?.id || ''
    }

    const dateStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    const [h, min] = selectedHeure.replace('h',':').split(':').map(Number)
    const totalMin = h*60 + (min||0) + selectedPrestation.duree_minutes
    const hFin = `${String(Math.floor(totalMin/60)).padStart(2,'0')}:${String(totalMin%60).padStart(2,'0')}`

    await supabase.from('rendez_vous').insert({
      prestataire_id: selectedPrestataire.id,
      cliente_id: clienteId,
      prestation_id: selectedPrestation.id,
      date_rdv: dateStr,
      heure_debut: selectedHeure.replace('h',':').padEnd(5,'0'),
      heure_fin: hFin,
      statut: 'confirme',
      prix_total: selectedPrestation.prix,
      acompte_montant: modePaiement === 'especes' ? 0 : selectedPrestation.acompte,
      notes: modePaiement === 'especes' ? 'Paiement espèces le jour J' : 'Acompte à régler',
    })

    setSaving(false)
    setConfirmed(true)
  }

  if (confirmed) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'#fdf8fb'}}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-100">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4" style={{background:'#FF80B5'}}>✓</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">RDV confirmé ! 🎉</h2>
        <p className="text-sm text-gray-500 mb-1">{selectedPrestation?.nom}</p>
        <p className="text-sm font-medium text-gray-700 mb-4">{selectedDay} {MONTHS[curMonth]} {curYear} — {selectedHeure}</p>
        <div className="rounded-xl p-3 mb-4 text-sm" style={{background:'#fff5f9', color:'#c05a8a'}}>
          {modePaiement === 'especes' ? `💵 ${selectedPrestation?.prix} € en espèces le jour J` : `💳 Acompte ${selectedPrestation?.acompte} € à régler`}
        </div>
        <p className="text-xs text-gray-400">📱 SMS de rappel envoyé au {form.telephone}</p>
      </div>
    </div>
  )

  const firstDay = new Date(curYear, curMonth, 1).getDay()
  const daysInMonth = new Date(curYear, curMonth+1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  return (
    <div className="min-h-screen" style={{background:'#fdf8fb'}}>
      <div className="bg-white border-b border-gray-100 px-4 py-4 text-center">
        <div className="text-xl font-bold" style={{color:'#FF80B5'}}>GlamBook</div>
        {selectedPrestataire && <div className="text-sm text-gray-500 mt-0.5">{selectedPrestataire.prenom} {selectedPrestataire.nom}</div>}
      </div>

      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Réserver un rendez-vous</h1>
        <p className="text-sm text-gray-400 mb-5">Sans créer de compte 🙌</p>

        {/* ÉTAPE 0 — Identité */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-700 mb-4">Vos coordonnées</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prénom *</label>
                  <input value={form.prenom} onChange={e => setForm(f=>({...f,prenom:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder="Votre prénom" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom (optionnel)</label>
                  <input value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder="Votre nom" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone * (rappel SMS)</label>
                  <input type="tel" value={form.telephone} onChange={e => setForm(f=>({...f,telephone:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder="06 XX XX XX XX" />
                </div>
              </div>
            </div>
            <button onClick={() => { if(form.prenom && form.telephone) setStep(1) }}
              disabled={!form.prenom || !form.telephone}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-40"
              style={{background:'#FF80B5'}}>Continuer →</button>
          </div>
        )}

        {/* ÉTAPE 1 — Prestation */}
        {step === 1 && (
          <div>
            <button onClick={() => setStep(0)} className="text-sm mb-4" style={{color:'#FF80B5'}}>← Retour</button>
            <div className="space-y-2">
              {prestations.map(p => (
                <button key={p.id} onClick={() => { setSelectedPrestation(p); loadRdvsMois(selectedPrestataire.id, curYear, curMonth); setStep(2) }}
                  className="w-full bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-pink-200 transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{p.nom}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.duree_minutes < 60 ? `${p.duree_minutes}min` : `${Math.floor(p.duree_minutes/60)}h${p.duree_minutes%60 ? p.duree_minutes%60+'min':''}`}</div>
                    </div>
                    <div className="font-bold text-lg" style={{color:'#FF80B5'}}>{p.prix} €</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Date */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-sm mb-4" style={{color:'#FF80B5'}}>← Changer</button>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => changeMonth(-1)} className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">‹</button>
                <div className="font-semibold">{MONTHS[curMonth]} {curYear}</div>
                <button onClick={() => changeMonth(1)} className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['L','M','M','J','V','S','D'].map((d,i) => <div key={i} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length: startOffset}).map((_,i) => <div key={`e${i}`}/>)}
                {Array.from({length: daysInMonth}).map((_,i) => {
                  const d = i+1
                  const isPast = new Date(curYear,curMonth,d) < new Date(today.getFullYear(),today.getMonth(),today.getDate())
                  const isSun = new Date(curYear,curMonth,d).getDay() === 0
                  const isSelected = selectedDay === d
                  const dispo = !isPast && !isSun && creneauxDispo(d).length > 0
                  return (
                    <button key={d} onClick={() => { if(dispo){setSelectedDay(d);setSelectedHeure('')}}} disabled={!dispo}
                      className="aspect-square rounded-lg text-xs font-medium flex items-center justify-center"
                      style={{background: isSelected ? '#FF80B5' : dispo ? '#fff5f9' : 'transparent', color: isSelected ? '#fff' : !dispo ? '#ddd' : '#111', border: isSelected ? '2px solid #FF80B5' : dispo ? '1px solid #ffd0e8' : '1px solid transparent'}}>
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
            {selectedDay && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
                <div className="text-sm font-medium text-gray-700 mb-3">Créneaux disponibles</div>
                <div className="grid grid-cols-4 gap-2">
                  {creneauxDispo(selectedDay).map(h => (
                    <button key={h} onClick={() => setSelectedHeure(h)}
                      className="py-2 rounded-lg text-sm font-medium"
                      style={{background: selectedHeure===h ? '#FF80B5' : '#fff5f9', color: selectedHeure===h ? '#fff' : '#FF80B5', border:`1px solid ${selectedHeure===h ? '#FF80B5' : '#ffd0e8'}`}}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedDay && selectedHeure && (
              <button onClick={() => setStep(3)} className="w-full py-3 rounded-xl text-white font-semibold" style={{background:'#FF80B5'}}>Continuer →</button>
            )}
          </div>
        )}

        {/* ÉTAPE 3 — Récap */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="text-sm mb-4" style={{color:'#FF80B5'}}>← Modifier</button>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Récapitulatif</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Nom</span><span className="font-medium">{form.prenom} {form.nom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Téléphone</span><span className="font-medium">{form.telephone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Prestation</span><span className="font-medium">{selectedPrestation?.nom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{selectedDay} {MONTHS[curMonth]} — {selectedHeure}</span></div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
                  <span>Total</span><span style={{color:'#FF80B5'}}>{selectedPrestation?.prix} €</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Mode de paiement</div>
              <div className="space-y-2">
                <button onClick={() => setModePaiement('especes')} className="w-full p-3 rounded-xl border-2 text-left"
                  style={{borderColor: modePaiement==='especes' ? '#FF80B5' : '#e5e7eb', background: modePaiement==='especes' ? '#fff5f9' : 'white'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{borderColor:'#FF80B5', background: modePaiement==='especes' ? '#FF80B5' : 'white'}}>
                      {modePaiement==='especes' && <div className="w-2 h-2 rounded-full bg-white"/>}
                    </div>
                    <div><div className="font-medium text-sm">💵 Espèces le jour J</div><div className="text-xs text-gray-400">Total {selectedPrestation?.prix} € sur place</div></div>
                  </div>
                </button>
                {selectedPrestation?.acompte > 0 && (
                  <button onClick={() => setModePaiement('acompte')} className="w-full p-3 rounded-xl border-2 text-left"
                    style={{borderColor: modePaiement==='acompte' ? '#FF80B5' : '#e5e7eb', background: modePaiement==='acompte' ? '#fff5f9' : 'white'}}>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{borderColor:'#FF80B5', background: modePaiement==='acompte' ? '#FF80B5' : 'white'}}>
                        {modePaiement==='acompte' && <div className="w-2 h-2 rounded-full bg-white"/>}
                      </div>
                      <div><div className="font-medium text-sm">💳 Acompte en ligne — {selectedPrestation.acompte} €</div><div className="text-xs text-gray-400">Sécurisez votre créneau maintenant</div></div>
                    </div>
                  </button>
                )}
              </div>
            </div>
            <button onClick={confirmerRdv} disabled={saving}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-40 mb-2"
              style={{background:'#FF80B5'}}>
              {saving ? 'Confirmation...' : '✓ Confirmer mon RDV'}
            </button>
            <p className="text-xs text-center text-gray-400">SMS de rappel automatique 24h avant 📱</p>
          </div>
        )}
      </div>
    </div>
  )
}
