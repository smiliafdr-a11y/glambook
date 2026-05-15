'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cliente, JournalPrestation } from '@/types'

const inputStyle: React.CSSProperties = {
  width:'100%', border:'1.5px solid var(--border)', borderRadius:10,
  padding:'10px 14px', fontSize:13, outline:'none',
  background:'var(--bg2)', color:'var(--text)'
}
const labelStyle: React.CSSProperties = {
  display:'block', fontSize:11, fontWeight:700,
  color:'var(--text2)', marginBottom:6,
  textTransform:'uppercase', letterSpacing:'0.07em'
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [journal, setJournal] = useState<JournalPrestation[]>([])
  const [prestataireId, setPrestataireId] = useState('')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCliente, setNewCliente] = useState({ prenom:'', nom:'', email:'', telephone:'', allergies:'', notes_privees:'' })
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
    setEditingNotes(false)
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

    // Chercher si la cliente a DÉJÀ une fiche (créée lors de son inscription)
    // par email OU téléphone — dans ce cas on met à jour sa fiche existante
    let ficheExistante: any = null

    if (newCliente.email) {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', newCliente.email)
        .maybeSingle()
      if (data) ficheExistante = data
    }

    if (!ficheExistante && newCliente.telephone) {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('telephone', newCliente.telephone)
        .maybeSingle()
      if (data) ficheExistante = data
    }

    let result: any = null

    if (ficheExistante) {
      // Fiche existante — on la lie à cette prestataire + on complète les infos
      const { data } = await supabase
        .from('clientes')
        .update({
          prestataire_id: prestataireId,
          prenom: newCliente.prenom || ficheExistante.prenom,
          nom: newCliente.nom || ficheExistante.nom,
          email: newCliente.email || ficheExistante.email,
          telephone: newCliente.telephone || ficheExistante.telephone,
          allergies: newCliente.allergies || ficheExistante.allergies,
          notes_privees: newCliente.notes_privees || ficheExistante.notes_privees,
        })
        .eq('id', ficheExistante.id)
        .select()
        .single()
      result = data
    } else {
      // Nouvelle cliente sans compte — créer la fiche
      const { data } = await supabase.from('clientes').insert({
        prestataire_id: prestataireId,
        ...newCliente,
        premiere_visite: new Date().toISOString().split('T')[0],
      }).select().single()
      result = data
    }

    if (result) {
      loadClientes(prestataireId)
      setShowAddModal(false)
      setNewCliente({ prenom:'', nom:'', email:'', telephone:'', allergies:'', notes_privees:'' })
      selectCliente(result)
    }
  }

  // Appelée quand on veut lier manuellement un compte existant à une fiche cliente
  async function lierCompteCliente(clienteId: string, email: string) {
    if (!email) return
    const { data: existingCliente } = await supabase
      .from('clientes')
      .select('user_id')
      .eq('email', email)
      .not('user_id', 'is', null)
      .maybeSingle()
    if (existingCliente?.user_id) {
      await supabase.from('clientes').update({ user_id: existingCliente.user_id }).eq('id', clienteId)
      loadClientes(prestataireId)
      return true
    }
    return false
  }

  const filtered = clientes.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatut = (c: Cliente) => {
    const nb = c.nb_prestations || 0
    if (nb === 0) return { label: 'Nouvelle', bg: 'var(--accent-bg)', color: 'var(--accent)' }
    if (nb >= 10) return { label: 'VIP', bg: '#FDF6E7', color: '#946B10' }
    return { label: 'Fidèle', bg: 'var(--ok-bg)', color: 'var(--ok)' }
  }

  return (
    <div style={{ display:'flex', height:'100%' }}>

      {/* LISTE SIDEBAR */}
      <div style={{ width:260, minWidth:260, background:'var(--card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <h2 style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>Clientes ({clientes.length})</h2>
            <button onClick={() => setShowAddModal(true)}
              style={{ fontSize:11, background:'var(--accent)', color:'#fff', padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600 }}>
              + Ajouter
            </button>
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:10, padding:'8px 12px', fontSize:13, outline:'none', background:'var(--bg2)', color:'var(--text)' }}
          />
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding:24, textAlign:'center', color:'var(--text3)', fontSize:13 }}>Aucune cliente</div>
          )}
          {filtered.map(c => (
            <button key={c.id} onClick={() => selectCliente(c)} style={{
              width:'100%', textAlign:'left', padding:'12px 16px',
              borderBottom:'1px solid var(--border)',
              borderRight: selected?.id === c.id ? '2px solid var(--accent)' : '2px solid transparent',
              background: selected?.id === c.id ? 'var(--accent-bg)' : 'transparent',
              cursor:'pointer', display:'flex', alignItems:'center', gap:10
            }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--accent-bg)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                {c.prenom?.[0]}{c.nom?.[0]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.prenom} {c.nom}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{c.nb_prestations || 0} presta · {c.ca_total || 0} €</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FICHE CLIENTE — DESIGN B */}
      <div style={{ flex:1, overflowY:'auto', padding:28 }}>
        {!selected ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:12, color:'var(--text3)' }}>
            <div style={{ fontSize:40 }}>👤</div>
            <p style={{ fontSize:13 }}>Sélectionnez une cliente pour voir sa fiche</p>
          </div>
        ) : (
          <div style={{ maxWidth:680 }}>

            {/* === CARD PROFIL — DESIGN B === */}
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:22, marginBottom:16, boxShadow:'var(--shadow)' }}>

              {/* Ligne avatar + nom + badge statut */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--accent-bg)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, flexShrink:0 }}>
                  {selected.prenom?.[0]}{selected.nom?.[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:600, color:'var(--text)' }}>{selected.prenom} {selected.nom}</div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
                    Cliente depuis {selected.premiere_visite ? new Date(selected.premiere_visite).toLocaleDateString('fr-FR', { month:'long', year:'numeric' }) : 'inconnue'}
                  </div>
                  {(() => { const s = getStatut(selected); return (
                    <span style={{ display:'inline-block', marginTop:5, fontSize:11, background:s.bg, color:s.color, padding:'2px 10px', borderRadius:20, fontWeight:600 }}>{s.label}</span>
                  )})()}
                </div>
                <button onClick={() => setEditingNotes(!editingNotes)}
                  style={{ fontSize:12, color:'var(--accent)', background:'var(--accent-bg)', border:'none', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontWeight:600 }}>
                  Modifier
                </button>
              </div>

              {/* Contact + stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                <div style={{ background:'var(--bg2)', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>📞 Téléphone</div>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{selected.telephone || '—'}</div>
                </div>
                <div style={{ background:'var(--bg2)', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>✉️ Email</div>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected.email || '—'}</div>
                </div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                {[
                  { val: selected.nb_prestations || 0, label: 'Prestations' },
                  { val: `${selected.ca_total || 0} €`, label: 'CA total' },
                  { val: selected.nb_prestations || 0, label: 'Visites' },
                ].map((s, i) => (
                  <div key={i} style={{ flex:1, background:'var(--bg2)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:700, color:'var(--text)' }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ALLERGIES */}
            {selected.allergies && (
              <div style={{ background:'#FFF1F2', border:'1px solid #FECDD3', borderRadius:14, padding:'14px 18px', marginBottom:16 }}>
                <div style={{ fontWeight:700, color:'#BE123C', fontSize:13, marginBottom:4 }}>⚠️ Allergies / Contre-indications</div>
                <div style={{ fontSize:13, color:'#9F1239' }}>{selected.allergies}</div>
              </div>
            )}

            {/* NOTES PRIVÉES */}
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <h3 style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>📝 Notes privées</h3>
                {!editingNotes ? (
                  <button onClick={() => setEditingNotes(true)} style={{ fontSize:12, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Modifier</button>
                ) : (
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setEditingNotes(false)} style={{ fontSize:12, color:'var(--text2)', background:'none', border:'none', cursor:'pointer' }}>Annuler</button>
                    <button onClick={saveNotes} style={{ fontSize:12, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Sauvegarder</button>
                  </div>
                )}
              </div>
              {editingNotes ? (
                <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                  placeholder="Préférences, ce qui fonctionne bien, remarques..."
                  style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13, outline:'none', background:'var(--bg2)', color:'var(--text)', resize:'none' }} />
              ) : (
                <div style={{ fontSize:13, color: selected.notes_privees ? 'var(--text2)' : 'var(--text3)', fontStyle: selected.notes_privees ? 'normal' : 'italic', lineHeight:1.6 }}>
                  {selected.notes_privees || 'Aucune note. Cliquez sur Modifier pour en ajouter.'}
                </div>
              )}
            </div>

            {/* HISTORIQUE */}
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
              <h3 style={{ fontWeight:600, fontSize:13, color:'var(--text)', marginBottom:14 }}>📋 Historique des prestations</h3>
              {journal.length === 0 ? (
                <div style={{ fontSize:13, color:'var(--text3)', fontStyle:'italic' }}>Aucune prestation enregistrée.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {journal.map(j => (
                    <div key={j.id} style={{ display:'flex', gap:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
                      <div style={{ fontSize:11, color:'var(--text3)', minWidth:80, paddingTop:2 }}>
                        {j.date_prestation ? new Date(j.date_prestation).toLocaleDateString('fr-FR') : ''}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{j.prestation_nom}</div>
                        {j.notes_prestataire && (
                          <div style={{ fontSize:12, color:'var(--text2)', background:'var(--bg2)', borderLeft:'2px solid var(--accent)', padding:'6px 10px', borderRadius:'0 8px 8px 0', marginTop:6, lineHeight:1.5 }}>
                            {j.notes_prestataire}
                          </div>
                        )}
                        {j.recommandations && (
                          <div style={{ fontSize:12, color:'#2563eb', marginTop:4 }}>💡 {j.recommandations}</div>
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div style={{ background:'var(--card)', borderRadius:20, width:480, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ background:'var(--accent)', padding:'18px 24px', borderRadius:'20px 20px 0 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h3 style={{ color:'#fff', fontWeight:600, fontSize:15 }}>Nouvelle cliente</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color:'rgba(255,255,255,0.8)', background:'none', border:'none', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Prénom *</label>
                  <input value={newCliente.prenom} onChange={e => setNewCliente(f => ({ ...f, prenom: e.target.value }))}
                    style={inputStyle} placeholder="Amina" />
                </div>
                <div>
                  <label style={labelStyle}>Nom *</label>
                  <input value={newCliente.nom} onChange={e => setNewCliente(f => ({ ...f, nom: e.target.value }))}
                    style={inputStyle} placeholder="Benali" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={newCliente.email} onChange={e => setNewCliente(f => ({ ...f, email: e.target.value }))}
                  style={inputStyle} placeholder="amina@email.com" />
              </div>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input value={newCliente.telephone} onChange={e => setNewCliente(f => ({ ...f, telephone: e.target.value }))}
                  style={inputStyle} placeholder="06 XX XX XX XX" />
              </div>
              <div>
                <label style={labelStyle}>Allergies / Contre-indications</label>
                <input value={newCliente.allergies} onChange={e => setNewCliente(f => ({ ...f, allergies: e.target.value }))}
                  style={inputStyle} placeholder="ex: allergie gel UV" />
              </div>
              <div>
                <label style={labelStyle}>Note initiale</label>
                <textarea value={newCliente.notes_privees} onChange={e => setNewCliente(f => ({ ...f, notes_privees: e.target.value }))}
                  rows={3} placeholder="Préférences, remarques..."
                  style={{ ...inputStyle, resize:'none' }} />
              </div>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', gap:12 }}>
              <button onClick={() => setShowAddModal(false)}
                style={{ flex:1, padding:'11px', border:'1.5px solid var(--border)', borderRadius:11, fontSize:13, background:'var(--bg2)', color:'var(--text2)', cursor:'pointer' }}>
                Annuler
              </button>
              <button onClick={addCliente} disabled={!newCliente.prenom || !newCliente.nom}
                style={{ flex:1, padding:'11px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:11, fontSize:13, fontWeight:600, cursor:'pointer', opacity: (!newCliente.prenom || !newCliente.nom) ? 0.4 : 1 }}>
                Ajouter la cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
