'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function ReserverContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const today = new Date()
  const [prestations, setPrestations] = useState<any[]>([])
  const [selectedPrestataire, setSelectedPrestataire] = useState<any>(null)
  const [selectedPrestation, setSelectedPrestation] = useState<any>(null)
  const [curYear, setCurYear] = useState(today.getFullYear())
  const [curMonth, setCurMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number|null>(null)
  const [selectedHeure, setSelectedHeure] = useState('')
  const [modePaiement, setModePaiement] = useState<'acompte'|'especes'>('acompte')
  const [step, setStep] = useState(1)
  const [clienteId, setClienteId] = useState('')
  const [saving, setSaving] = useState(false)
  const [rdvsExistants, setRdvsExistants] = useState<any[]>([])
  const [confirmed, setConfirmed] = useState(false)

  const CRENEAUX = ['9h00','9h30','10h00','10h30','11h00','11h30','14h00','14h30','15h00','15h30','16h00','16h30','17h00','17h30']

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: cliente } = await supabase.from('clientes').select('id,prestataire_id').eq('user_id', user.id).maybeSingle()
    if (cliente) setClienteId(cliente.id)

    // Récupérer prestataire_id depuis l'URL EN PRIORITÉ (venant du profil public)
    const presIdFromUrl = searchParams.get('prestataire_id')
    const presId = presIdFromUrl || cliente?.prestataire_id

    // Si on vient du profil public, lier la prestataire à la cliente
    if (presIdFromUrl && cliente && presIdFromUrl !== cliente.prestataire_id) {
      await supabase.from('clientes').update({ prestataire_id: presIdFromUrl }).eq('id', cliente.id)
    }

    if (!presId) { return } // Pas de prestataire trouvée

    const { data: pres } = await supabase.from('prestataires').select('*').eq('id', presId).maybeSingle()
    setSelectedPrestataire(pres)
    if (pres) {
      const { data } = await supabase.from('prestations').select('*').eq('prestataire_id', pres.id).eq('actif', true).order('categorie')
      setPrestations(data || [])
      loadRdvsMois(pres.id, today.getFullYear(), today.getMonth())
    }
  }

  async function loadRdvsMois(presId: string, y: number, m: number) {
    const start = `${y}-${String(m+1).padStart(2,'0')}-01`
    const end = `${y}-${String(m+1).padStart(2,'0')}-${new Date(y,m+1,0).getDate()}`
    const { data } = await supabase.from('rendez_vous').select('date_rdv,heure_debut,heure_fin').eq('prestataire_id', presId).gte('date_rdv', start).lte('date_rdv', end).neq('statut','annule')
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
        const rdvMin = rh * 60 + (rm || 0)
        const dur = selectedPrestation?.duree_minutes || 60
        return Math.abs(rdvMin - heureMin) < dur
      })
    })
  }

  async function confirmerRdv() {
    if (!selectedDay || !selectedHeure || !selectedPrestation || !selectedPrestataire) return

    // Vérifier si la cliente est connectée
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Pas connectée — rediriger vers inscription avec toutes les infos du RDV
      const dateStr = \`\${curYear}-\${String(curMonth+1).padStart(2,'0')}-\${String(selectedDay).padStart(2,'0')}\`
      const params = new URLSearchParams({
        role: 'cliente',
        prestataire_id: selectedPrestataire.id,
        rdv_date: dateStr,
        rdv_heure: selectedHeure,
        rdv_prestation: selectedPrestation.id,
      })
      router.push(\`/auth/register?\${params.toString()}\`)
      return
    }

    setSaving(true)
    let cId = clienteId

    if (!cId) {
      const { data: ficheExist } = await supabase.from('clientes').select('id').eq('user_id', user.id).maybeSingle()
      if (ficheExist) {
        cId = ficheExist.id
        await supabase.from('clientes').update({ prestataire_id: selectedPrestataire.id }).eq('id', ficheExist.id)
      } else {
        const { data: newC } = await supabase.from('clientes').insert({
          user_id: user.id,
          prestataire_id: selectedPrestataire.id,
          prenom: user.email?.split('@')[0] || 'Cliente',
          nom: '',
          email: user.email,
          premiere_visite: new Date().toISOString().split('T')[0],
        }).select().single()
        cId = newC?.id || ''
      }
      setClienteId(cId)
    }

    if (!cId) { setSaving(false); return }

    const dateStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    const [h, min] = selectedHeure.replace('h',':').split(':').map(Number)
    const totalMin = h*60 + (min||0) + selectedPrestation.duree_minutes
    const hFin = `${String(Math.floor(totalMin/60)).padStart(2,'0')}:${String(totalMin%60).padStart(2,'0')}`

    await supabase.from('rendez_vous').insert({
      prestataire_id: selectedPrestataire.id,
      cliente_id: cId,
      prestation_id: selectedPrestation.id,
      date_rdv: dateStr,
      heure_debut: selectedHeure.replace('h',':').padEnd(5,'0'),
      heure_fin: hFin,
      statut: 'confirme',
      prix_total: selectedPrestation.prix,
      acompte_montant: modePaiement === 'especes' ? 0 : selectedPrestation.acompte,
      acompte_paye: false,
      notes: modePaiement === 'especes' ? 'Paiement intégral en espèces le jour J' : '',
    })
    setSaving(false)
    setConfirmed(true)
  }

  // CONFIRMATION
  if (confirmed) return (
    <div className="p-4 flex flex-col items-center justify-center min-h-96 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl mb-4" style={{background:'var(--accent)'}}>✓</div>
      <h2 className="text-xl font-bold mb-2">RDV confirmé !</h2>
      <p className="text-sm mb-1">{selectedPrestation?.nom}</p>
      <p className="text-sm mb-4">{selectedDay} {MONTHS[curMonth]} — {selectedHeure}</p>
      {modePaiement === 'especes' ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-700">
          💵 Paiement de <strong>{selectedPrestation?.prix} €</strong> en espèces le jour J
        </div>
      ) : (
        <div className="rounded-xl p-3 mb-4 text-sm" style={{background:'var(--accent-bg)',color:'var(--accent-d)'}}>
          💳 Acompte de <strong>{selectedPrestation?.acompte} €</strong> à régler avant le RDV
        </div>
      )}
      <p className="text-xs mb-1">Rappel SMS envoyé 24h avant</p>
      <button onClick={() => router.push('/cliente/accueil')} className="mt-4 px-6 py-3 rounded-xl text-white font-medium" style={{background:'var(--accent)'}}>
        Retour à l'accueil
      </button>
    </div>
  )

  const firstDay = new Date(curYear, curMonth, 1).getDay()
  const daysInMonth = new Date(curYear, curMonth+1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Réserver une prestation</h1>

      {/* STEP INDICATOR */}
      <div className="flex items-center gap-2 mb-6">
        {['Prestation','Date & heure','Confirmation'].map((s,i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{background: step > i+1 ? 'var(--accent)' : step === i+1 ? 'var(--accent)' : '#e5e7eb', color: step >= i+1 ? 'white' : '#9ca3af'}}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <span className="text-xs font-medium" style={{color: step === i+1 ? 'var(--accent)' : '#9ca3af'}}>{s}</span>
            </div>
            {i < 2 && <div className="flex-1 h-px bg-gray-200"/>}
          </div>
        ))}
      </div>

      {/* ÉTAPE 1 */}
      {step === 1 && (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {prestations.map(p => (
            <button key={p.id} onClick={() => { setSelectedPrestation(p); setStep(2) }}
              style={{
                width:'100%', textAlign:'left', background:'var(--card)',
                border:'1px solid var(--border)', borderRadius:14,
                padding:'16px 18px', cursor:'pointer',
                boxShadow:'var(--shadow)'
              }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:600, fontSize:14, color:'var(--text)', marginBottom:4}}>{p.nom}</div>
                  <div style={{fontSize:12, color:'var(--text3)'}}>
                    ⏱ {p.duree_minutes < 60 ? `${p.duree_minutes}min` : `${Math.floor(p.duree_minutes/60)}h${p.duree_minutes%60 ? p.duree_minutes%60+'min':''}`}
                  </div>
                  {p.description && <div style={{fontSize:12, color:'var(--text2)', marginTop:4}}>{p.description}</div>}
                </div>
                <div style={{textAlign:'right', marginLeft:16, flexShrink:0}}>
                  <div style={{fontWeight:700, fontSize:18, color:'var(--accent)'}}>{p.prix} €</div>
                  {p.acompte > 0 && <div style={{fontSize:11, color:'var(--text3)', marginTop:2}}>Acompte {p.acompte} €</div>}
                </div>
              </div>
            </button>
          ))}
          {prestations.length === 0 && <div style={{textAlign:'center', padding:'40px 0', color:'var(--text3)', fontSize:13}}>Aucune prestation disponible</div>}
        </div>
      )}

      {/* ÉTAPE 2 */}
      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} className="text-sm mb-4 flex items-center gap-1" style={{color:'var(--accent)'}}>← Changer de prestation</button>
          <div style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
              <button onClick={() => changeMonth(-1)} className="w-8 h-8 border rounded-lg flex items-center justify-center">‹</button>
              <div className="font-semibold">{MONTHS[curMonth]} {curYear}</div>
              <button onClick={() => changeMonth(1)} className="w-8 h-8 border rounded-lg flex items-center justify-center">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['L','M','M','J','V','S','D'].map((d,i) => <div key={i} className="text-center text-xs py-1">{d}</div>)}
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
                  <button key={d} onClick={() => { if(dispo){setSelectedDay(d);setSelectedHeure('')}}}
                    disabled={!dispo}
                    className="aspect-square rounded-lg text-xs font-medium flex items-center justify-center"
                    style={{
                      background: isSelected ? 'var(--accent)' : dispo ? 'var(--accent-bg)' : 'transparent',
                      color: isSelected ? '#fff' : !dispo ? '#ddd' : '#111',
                      border: isSelected ? '2px solid var(--accent)' : dispo ? '1px solid var(--accent-mid)' : '1px solid transparent',
                    }}>
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedDay && (
            <div style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px', marginBottom:12}}>
              <div style={{fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:12}}>Créneaux disponibles</div>
              <div className="grid grid-cols-4 gap-2">
                {creneauxDispo(selectedDay).map(h => (
                  <button key={h} onClick={() => setSelectedHeure(h)}
                    className="py-2 rounded-lg text-sm font-medium"
                    style={{background: selectedHeure===h ? 'var(--accent)' : 'var(--accent-bg)', color: selectedHeure===h ? '#fff' : 'var(--accent)', border: `1px solid ${selectedHeure===h ? 'var(--accent)' : 'var(--accent-mid)'}`}}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDay && selectedHeure && (
            <button onClick={() => setStep(3)} className="w-full py-3 rounded-xl text-white font-semibold" style={{background:'var(--accent)'}}>
              Continuer →
            </button>
          )}
        </div>
      )}

      {/* ÉTAPE 3 — RECAP + MODE PAIEMENT */}
      {step === 3 && (
        <div>
          <button onClick={() => setStep(2)} className="text-sm mb-4 flex items-center gap-1" style={{color:'var(--accent)'}}>← Modifier le créneau</button>

          <div style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 18px', marginBottom:12}}>
            <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12}}>Récapitulatif</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-theme2">Prestation</span><span className="font-medium">{selectedPrestation?.nom}</span></div>
              <div className="flex justify-between text-sm"><span className="text-theme2">Date</span><span className="font-medium">{selectedDay} {MONTHS[curMonth]} {curYear}</span></div>
              <div className="flex justify-between text-sm"><span className="text-theme2">Heure</span><span className="font-medium">{selectedHeure}</span></div>
              <div className="flex justify-between text-sm"><span className="text-theme2">Durée</span><span className="font-medium">{selectedPrestation?.duree_minutes}min</span></div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span><span style={{color:'var(--accent)'}}>{selectedPrestation?.prix} €</span>
              </div>
            </div>
          </div>

          {/* MODE DE PAIEMENT */}
          <div style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 18px', marginBottom:12}}>
            <div style={{fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12}}>Mode de paiement</div>
            <div className="space-y-2">
              {selectedPrestation?.acompte > 0 && (
                <button onClick={() => setModePaiement('acompte')}
                  className="w-full p-3 rounded-xl border-2 text-left transition-all"
                  style={{borderColor: modePaiement==='acompte' ? 'var(--accent)' : '#e5e7eb', background: modePaiement==='acompte' ? 'var(--accent-bg)' : 'white'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{borderColor:'var(--accent)', background: modePaiement==='acompte' ? 'var(--accent)' : 'white'}}>
                      {modePaiement==='acompte' && <div style={{background:'var(--card)'}}/>}
                    </div>
                    <div>
                      <div className="font-medium text-sm">💳 Acompte en ligne — {selectedPrestation.acompte} €</div>
                      <div className="text-xs">Sécurisez votre créneau maintenant, solde le jour J</div>
                    </div>
                  </div>
                </button>
              )}
              <button onClick={() => setModePaiement('especes')}
                className="w-full p-3 rounded-xl border-2 text-left transition-all"
                style={{borderColor: modePaiement==='especes' ? 'var(--accent)' : '#e5e7eb', background: modePaiement==='especes' ? 'var(--accent-bg)' : 'white'}}>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{borderColor:'var(--accent)', background: modePaiement==='especes' ? 'var(--accent)' : 'white'}}>
                    {modePaiement==='especes' && <div style={{background:'var(--card)'}}/>}
                  </div>
                  <div>
                    <div className="font-medium text-sm">💵 Paiement en espèces le jour J</div>
                    <div className="text-xs">Payez le montant total ({selectedPrestation?.prix} €) à votre prestataire</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <button onClick={confirmerRdv} disabled={saving}
            className="w-full py-3 rounded-xl text-white font-semibold mb-3 disabled:opacity-40"
            style={{background:'var(--accent)'}}>
            {saving ? 'Confirmation...' : modePaiement === 'especes' ? 'Confirmer le RDV — paiement sur place' : `Confirmer et payer l'acompte — ${selectedPrestation?.acompte} €`}
          </button>
          <div className="text-xs text-center">Annulation gratuite jusqu'à 24h avant le RDV</div>
        </div>
      )}
    </div>
  )
}

export default function ReserverPage() {
  return (
    <Suspense fallback={<div style={{padding:40, textAlign:'center', color:'var(--text3)'}}>Chargement...</div>}>
      <ReserverContent />
    </Suspense>
  )
}
