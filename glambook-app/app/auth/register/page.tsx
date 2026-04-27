'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'prestataire'

  const [role, setRole] = useState<'prestataire' | 'cliente'>(defaultRole as 'prestataire' | 'cliente')
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

    // Créer le compte auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError || !data.user) {
      setError(authError?.message || 'Erreur lors de la création du compte.')
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
      router.push('/cliente/accueil')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-500">GlamBook</Link>
          <p className="text-gray-500 mt-2 text-sm">Créez votre compte en 1 minute</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Toggle rôle */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6">
            <button
              onClick={() => setRole('prestataire')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${role === 'prestataire' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              💅 Je suis prestataire
            </button>
            <button
              onClick={() => setRole('cliente')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${role === 'cliente' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              👤 Je suis cliente
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text" value={form.prenom} onChange={e => update('prenom', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="Nadia" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text" value={form.nom} onChange={e => update('nom', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="Soltani" required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="nadia@glambook.fr" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password" value={form.password} onChange={e => update('password', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="8 caractères minimum" required minLength={8}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer mon compte gratuitement'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            En créant un compte, vous acceptez nos{' '}
            <Link href="/cgv" className="underline">CGV</Link>
          </p>

          <div className="mt-4 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-brand-500 font-medium hover:underline">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
