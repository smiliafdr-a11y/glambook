'use client'
import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'prestataire'
  const prestataireIdFromUrl = searchParams.get('prestataire_id') || null
  const [role, setRole] = useState(defaultRole as 'prestataire' | 'cliente')
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError || !data.user) {
      setError(authError?.message || 'Erreur.')
      setLoading(false)
      return
    }

    if (role === 'prestataire') {
      const { error: presError } = await supabase.from('prestataires').insert({
        user_id: data.user.id,
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        plan: 'starter',
      })
      if (presError) { setError(presError.message); setLoading(false); return }
      router.push('/prestataire/dashboard')
    } else {
      // Cliente — chercher si une fiche existe déjà par email OU téléphone (créée par prestataire)
      let ficheExistante: any = null

      if (form.email) {
        const { data: parEmail } = await supabase
          .from('clientes')
          .select('id, prestataire_id')
          .eq('email', form.email)
          .is('user_id', null)
          .maybeSingle()
        if (parEmail) ficheExistante = parEmail
      }

      if (!ficheExistante && form.telephone) {
        const telClean = form.telephone.replace(/\s/g, '')
        const { data: parTel } = await supabase
          .from('clientes')
          .select('id, prestataire_id')
          .eq('telephone', telClean)
          .is('user_id', null)
          .maybeSingle()
        if (parTel) ficheExistante = parTel
      }

      if (ficheExistante) {
        // Lier le compte à la fiche existante — la cliente verra ses RDV automatiquement
        await supabase.from('clientes')
          .update({
            user_id: data.user.id,
            prenom: form.prenom,
            nom: form.nom,
            email: form.email,
            telephone: form.telephone.replace(/\s/g, '') || undefined,
            ...(prestataireIdFromUrl ? { prestataire_id: prestataireIdFromUrl } : {}),
          })
          .eq('id', ficheExistante.id)
      } else {
        // Nouvelle cliente — créer sa fiche
        let presId = prestataireIdFromUrl
        if (!presId) { const { data: pres } = await supabase.from('prestataires').select('id').limit(1).single(); presId = pres?.id || null }
        const { error: clienteError } = await supabase.from('clientes').insert({
          user_id: data.user.id,
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone.replace(/\s/g, '') || null,
          prestataire_id: presId,
          premiere_visite: new Date().toISOString().split('T')[0],
        })
        if (clienteError) { setError(clienteError.message); setLoading(false); return }
      }

      // Si des params RDV sont dans l'URL, rediriger vers réservation pour finaliser
      const rdvDate = searchParams.get('rdv_date')
      const rdvHeure = searchParams.get('rdv_heure')
      const rdvPrestation = searchParams.get('rdv_prestation')
      const presId = prestataireIdFromUrl

      if (rdvDate && rdvHeure && rdvPrestation && presId) {
        router.push(`/cliente/reserver?prestataire_id=${presId}&rdv_date=${rdvDate}&rdv_heure=${rdvHeure}&rdv_prestation=${rdvPrestation}&auto=1`)
      } else {
        router.push('/cliente/accueil')
      }
    }
  }

  return (
    <div style={{background:'var(--card)'}}>
      <div className="flex border rounded-xl overflow-hidden mb-6">
        <button onClick={() => setRole('prestataire')} className="flex-1 py-2.5 text-sm font-medium"
          style={role === 'prestataire' ? {backgroundColor:'var(--accent)', color:'white'} : {color:'#9ca3af'}}>
          💅 Prestataire
        </button>
        <button onClick={() => setRole('cliente')} className="flex-1 py-2.5 text-sm font-medium"
          style={role === 'cliente' ? {backgroundColor:'var(--accent)', color:'white'} : {color:'#9ca3af'}}>
          👤 Cliente
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input type="text" value={form.prenom} onChange={e => update('prenom', e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none"
              placeholder="Nadia" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input type="text" value={form.nom} onChange={e => update('nom', e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none"
              placeholder="Soltani" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none"
            placeholder="nadia@glambook.fr" required />
        </div>
        {role === 'cliente' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)}
              style={{width:'100%', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13, outline:'none', background:'var(--bg2)', color:'var(--text)'}}
              placeholder="06 XX XX XX XX" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none"
            placeholder="8 caractères minimum" required minLength={8} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-50"
          style={{backgroundColor:'var(--accent)'}}>
          {loading ? 'Création...' : 'Créer mon compte gratuitement'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="font-medium hover:underline" style={{color:'var(--accent)'}}>Se connecter</Link>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{color:'var(--accent)'}}>GlamBook</Link>
          <p className="text-theme2 mt-2 text-sm">Créez votre compte en 1 minute</p>
        </div>
        <Suspense fallback={<div style={{background:'var(--card)'}}>Chargement...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
