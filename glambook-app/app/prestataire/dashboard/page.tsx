'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const STATUT_COLORS: Record<string, string> = {
  confirme: 'bg-pink-50 text-pink-700',
  en_attente: 'bg-yellow-50 text-yellow-700',
  termine: 'bg-green-50 text-green-700',
  annule: 'bg-gray-100 text-gray-400',
  no_show: 'bg-red-50 text-red-500',
}
const STATUT_LABELS: Record<string, string> = {
  confirme: 'Confirmé', en_attente: 'En attente', termine: 'Terminé', annule: 'Annulé', no_show: 'No-show',
}

export default function DashboardPage() {
  const [prestataire, setPrestataire] = useState<any>(null)
  const [rdvAujourdhui, setRdvAujourdhui] = useState<any[]>([])
  const [stats, setStats] = useState({ rdvMois: 0, caThisMonth: 0, nbClientes: 0, acomptes: 0 })
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pres } = await supabase.from('prestataires').select('*').eq('user_id', user.id).single()
    if (!pres) return
    setPrestataire(pres)

    const today = new Date().toISOString().split('T')[0]
    const { data: rdvs } = await supabase
      .from('rendez_vous')
      .select('*, cliente:clientes(nom, prenom), prestation:prestations(nom)')
      .eq('prestataire_id', pres.id)
      .eq('date_rdv', today)
      .order('heure_debut')
    setRdvAujourdhui(rdvs || [])

    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const { data: rdvsMois } = await supabase
      .from('rendez_vous').select('prix_total,acompte_montant,acompte_paye,statut')
      .eq('prestataire_id', pres.id).gte('date_rdv', startMonth).neq('statut','annule')

    const { count: nbClientes } = await supabase
      .from('clientes').select('*', {count:'exact',head:true}).eq('prestataire_id', pres.id)

    // Messages non lus
    const { data: msgs } = await supabase
      .from('messages').select('*, cliente:clientes(prenom,nom)')
      .eq('prestataire_id', pres.id).eq('lu', false).order('created_at', {ascending:false}).limit(3)
    setMessages(msgs || [])

    const ca = rdvsMois?.filter(r => r.statut === 'termine').reduce((s,r) => s+(r.prix_total||0), 0) || 0
    const acomptes = rdvsMois?.filter(r => r.acompte_paye).reduce((s,r) => s+(r.acompte_montant||0), 0) || 0
    setStats({ rdvMois: rdvsMois?.length || 0, caThisMonth: ca, nbClientes: nbClientes || 0, acomptes })
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Chargement...</div>
    </div>
  )

  const dateStr = new Date().toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long'})

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bonjour {prestataire?.prenom} ✨</h1>
        <p className="text-gray-400 text-xs md:text-sm mt-0.5 capitalize">{dateStr}</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {label:'RDV ce mois', value:stats.rdvMois, sub:'réservations', color:'#FF80B5'},
          {label:'CA du mois', value:`${stats.caThisMonth} €`, sub:'encaissé', color:'#10b981'},
          {label:'Acomptes', value:`${stats.acomptes} €`, sub:'sécurisés', color:'#6366f1'},
          {label:'Clientes', value:stats.nbClientes, sub:'au total', color:'#f59e0b'},
        ].map((s,i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 md:p-4">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className="text-xl md:text-2xl font-bold" style={{color:s.color}}>{s.value}</div>
            <div className="text-xs text-gray-300 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* MESSAGES NON LUS */}
      {messages.length > 0 && (
        <div className="bg-white rounded-xl border border-pink-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              💬 Messages <span className="bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>
            </div>
          </div>
          <div className="space-y-2">
            {messages.map(m => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg" style={{background:'#fff5f9'}}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:'#FF80B5'}}>
                  {(m.cliente as any)?.prenom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900">{(m.cliente as any)?.prenom} {(m.cliente as any)?.nom}</div>
                  <div className="text-xs text-gray-400 truncate">{m.contenu}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RDV DU JOUR */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-sm md:text-base">Rendez-vous aujourd'hui</h2>
          <Link href="/prestataire/agenda" className="text-xs hover:underline" style={{color:'#FF80B5'}}>Voir l'agenda →</Link>
        </div>
        {rdvAujourdhui.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">🌟</div>
            <p className="text-sm">Aucun rendez-vous aujourd'hui</p>
            <Link href="/prestataire/agenda" className="text-xs mt-2 inline-block hover:underline" style={{color:'#FF80B5'}}>Ajouter un RDV</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {rdvAujourdhui.map(rdv => (
              <div key={rdv.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-sm font-bold min-w-[45px]" style={{color:'#FF80B5'}}>{rdv.heure_debut?.slice(0,5)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {(rdv.cliente as any)?.prenom} {(rdv.cliente as any)?.nom}
                    {rdv.acompte_paye && <span className="ml-1 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">✓</span>}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{(rdv.prestation as any)?.nom} · {rdv.prix_total} €</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUT_COLORS[rdv.statut]}`}>
                  {STATUT_LABELS[rdv.statut]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          {href:'/prestataire/agenda', icon:'📅', label:'Nouveau RDV'},
          {href:'/prestataire/clientes', icon:'👤', label:'Clientes'},
          {href:'/prestataire/liste-attente', icon:'🔔', label:'Attente'},
        ].map((a,i) => (
          <Link key={i} href={a.href} className="bg-white border border-gray-100 rounded-xl p-3 text-center hover:shadow-sm hover:border-pink-100 transition-all">
            <div className="text-xl md:text-2xl mb-1">{a.icon}</div>
            <div className="text-xs font-medium text-gray-600">{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
