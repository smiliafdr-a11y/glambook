'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RendezVous, Prestataire } from '@/types'
import Link from 'next/link'

const STATUT_COLORS: Record<string, string> = {
  confirme: 'bg-orange-50 text-orange-700',
  en_attente: 'bg-yellow-50 text-yellow-700',
  termine: 'bg-green-50 text-green-700',
  annule: 'bg-gray-100 text-gray-400 line-through',
  no_show: 'bg-red-50 text-red-500',
}

const STATUT_LABELS: Record<string, string> = {
  confirme: 'Confirmé',
  en_attente: 'En attente',
  termine: 'Terminé',
  annule: 'Annulé',
  no_show: 'No-show',
}

export default function DashboardPage() {
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null)
  const [rdvAujourdhui, setRdvAujourdhui] = useState<RendezVous[]>([])
  const [stats, setStats] = useState({ rdvSemaine: 0, caThisMonth: 0, nbClientes: 0, acomptes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: pres } = await supabase
      .from('prestataires')
      .select('*')
      .eq('user_id', user.id)
      .single()

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

    // Stats du mois
    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const { data: rdvsMois } = await supabase
      .from('rendez_vous')
      .select('prix_total, acompte_montant, acompte_paye, statut')
      .eq('prestataire_id', pres.id)
      .gte('date_rdv', startMonth)
      .neq('statut', 'annule')

    const { count: nbClientes } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('prestataire_id', pres.id)

    const ca = rdvsMois?.filter(r => r.statut === 'termine').reduce((s, r) => s + (r.prix_total || 0), 0) || 0
    const acomptes = rdvsMois?.filter(r => r.acompte_paye).reduce((s, r) => s + (r.acompte_montant || 0), 0) || 0

    setStats({
      rdvSemaine: rdvsMois?.length || 0,
      caThisMonth: ca,
      nbClientes: nbClientes || 0,
      acomptes,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    )
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {prestataire?.prenom} ✨
        </h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">{dateStr}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'RDV ce mois', value: stats.rdvSemaine, sub: 'reservations', color: 'text-brand-500' },
          { label: 'CA du mois', value: `${stats.caThisMonth} €`, sub: 'encaissé', color: 'text-green-600' },
          { label: 'Acomptes reçus', value: `${stats.acomptes} €`, sub: 'sécurisés', color: 'text-blue-600' },
          { label: 'Mes clientes', value: stats.nbClientes, sub: 'au total', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-300 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* RDV du jour */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Rendez-vous aujourd'hui</h2>
          <Link href="/prestataire/agenda" className="text-xs text-brand-500 hover:underline">
            Voir l'agenda →
          </Link>
        </div>

        {rdvAujourdhui.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-3xl mb-2">🌟</div>
            <p className="text-sm">Aucun rendez-vous aujourd'hui.</p>
            <Link href="/prestataire/agenda" className="text-xs text-brand-500 mt-2 inline-block hover:underline">
              Ajouter un RDV
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rdvAujourdhui.map(rdv => (
              <div key={rdv.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-sm font-bold text-brand-500 min-w-[50px]">
                  {rdv.heure_debut.slice(0, 5)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {(rdv.cliente as any)?.prenom} {(rdv.cliente as any)?.nom}
                    {rdv.acompte_paye && (
                      <span className="ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        Acompte ✓
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{(rdv.prestation as any)?.nom} · {rdv.prix_total} €</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[rdv.statut]}`}>
                  {STATUT_LABELS[rdv.statut]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {[
          { href: '/prestataire/agenda', icon: '📅', label: 'Nouveau RDV' },
          { href: '/prestataire/clientes', icon: '👤', label: 'Mes clientes' },
          { href: '/prestataire/liste-attente', icon: '🔔', label: 'Liste d\'attente' },
        ].map((a, i) => (
          <Link key={i} href={a.href} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-sm hover:border-brand-200 transition-all">
            <div className="text-2xl mb-1">{a.icon}</div>
            <div className="text-xs font-medium text-gray-600">{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
