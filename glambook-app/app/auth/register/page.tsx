'use client'
import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'prestataire'
  const [role, setRole] = useState(defaultRole as 'prestataire' | 'cliente')
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authError || !data.user) { setError(authError?.message || 'Erreur.'); setLoading(false); return }
    if (role === 'prestataire') {
      await supabase.from('prestataires').insert({ user_id: data.user.id, nom: form.nom, prenom: form.prenom, email: form.email, plan: 'starter' })
      router.push('/prestataire/dashboard')
    } else {
      router.push('/cliente/accueil')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6">
        <button onClick={() => setRole('prestataire')} className={`flex-1 py-2.5 text-sm font-medium ${role === 'prestataire' ? 'text-white' : 'text-gray-500'}`} style={role === 'prestataire' ? {backgroundColor:'#D85A30'} : {}}>💅 Prestataire</button>
        <button onClick={() => setRole('cliente')} className={`flex-1 py-2.5 text-sm font-medium ${role === 'cliente' ? 'text-white' : 'text-gray-500'}`} style={role === 'cliente' ? {backgroundColor:'#D85A30'} : {}}>👤 Cliente</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label><input type="text" value={form.prenom} onChange={e => update('prenom', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none" placeholder="Nadia" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom</label><input type="text" value={form.nom} onChange={e => update('nom', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none" placeholder="Soltani" required /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none" placeholder="nadia@glambook.fr" required /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label><input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none" placeholder="8 caractères minimum" required minLength={8} /></div>
        <button type="submit" disabled={loading} className="w-full text-white rounded-lg py-3 font-semibold text-sm" style={{backgroundColor:'#D85A30'}}>{loading ? 'Création...' : 'Créer mon compte gratuitement'}</button>
      </form>
      <div className="mt-4 text-center text-sm text-gray-500">Déjà un compte ? <Link href="/auth/login" className="font-medium hover:underline" style={{color:'#D85A30'}}>Se connecter</Link></div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{color:'#D85A30'}}>GlamBook</Link>
          <p className="text-gray-500 mt-2 text-sm">Créez votre compte en 1 minute</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">Chargement...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
