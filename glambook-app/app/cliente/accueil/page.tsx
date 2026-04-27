'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AccueilCliente() {
  const [prenom, setPrenom] = useState('')
  const [prochainsRdv, setProchainsRdv] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Récupérer le profil cliente
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (cliente) {
      setPrenom(cliente.prenom)
      // Prochains RDV
      const today = new Date().toISOString().split('T')[0]
      const { data: rdvs } = await supabase
        .from('rendez_vous')
        .select('*, prestation:prestations(nom), prestataire:prestataires(prenom, nom)')
        .eq('cliente_id', cliente.id)
        .gte('date_rdv', today)
        .neq('statut', 'annule')
        .order('date_rdv')
        .limit(3)
      setProchainsRdv(rdvs || [])
    }
    setLoading(false)
  }

  const heure = new Date().getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bonjour' : 'Bonsoir'

  return (
    <div className="p-4">
      {/* HERO */}
      <div className="rounded-2xl p-5 mb-4 text-white" style={{background:'linear-gradient(135deg, #FF80B5, #ff99c2)'}}>
        <div className="text-sm opacity-80 mb-1">{salut} ✨</div>
        <div className="text-2xl font-bold">{prenom || 'Bienvenue'}</div>
        {prochainsRdv.length > 0 && (
          <div className="mt-3 bg-white/20 rounded-xl p-3">
            <div className="text-xs opacity-80 mb-1">Prochain rendez-vous</div>
            <div className="font-semibold text-sm">
              {new Date(prochainsRdv[0].date_rdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {prochainsRdv[0].heure_debut?.slice(0,5)}
            </div>
            <div className="text-xs opacity-80 mt-0.5">{(prochainsRdv[0].prestation as any)?.nom}</div>
          </div>
        )}
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link href="/cliente/reserver" className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm text-center">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-sm font-medium text-gray-700">Réserver</div>
          <div className="text-xs text-gray-400 mt-0.5">Prendre un RDV</div>
        </Link>
        <Link href="/cliente/mes-rdv" className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm text-center">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-sm font-medium text-gray-700">Mes RDV</div>
          <div className="text-xs text-gray-400 mt-0.5">Voir l'historique</div>
        </Link>
        <Link href="/cliente/contact" className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm text-center">
          <div className="text-2xl mb-1">💬</div>
          <div className="text-sm font-medium text-gray-700">Contact</div>
          <div className="text-xs text-gray-400 mt-0.5">Envoyer un message</div>
        </Link>
        <Link href="/cliente/avis" className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm text-center">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-sm font-medium text-gray-700">Avis</div>
          <div className="text-xs text-gray-400 mt-0.5">Laisser un avis</div>
        </Link>
      </div>

      {/* PROCHAINS RDV */}
      {prochainsRdv.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="font-semibold text-gray-900 text-sm mb-3">Mes prochains RDV</div>
          <div className="space-y-3">
            {prochainsRdv.map(rdv => (
              <div key={rdv.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background:'#fff5f9'}}>
                <div className="text-2xl">💅</div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{(rdv.prestation as any)?.nom}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {rdv.heure_debut?.slice(0,5)}
                  </div>
                </div>
                {rdv.acompte_paye && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Acompte ✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {prochainsRdv.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">💅</div>
          <div className="font-medium text-gray-700 mb-1">Aucun RDV à venir</div>
          <div className="text-xs text-gray-400 mb-3">Réservez votre prochaine prestation !</div>
          <Link href="/cliente/reserver" className="inline-block text-white text-sm px-4 py-2 rounded-xl font-medium" style={{background:'#FF80B5'}}>
            Réserver maintenant
          </Link>
        </div>
      )}
    </div>
  )
}
