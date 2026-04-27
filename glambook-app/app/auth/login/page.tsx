'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }

    // Vérifier si prestataire
    const { data: prestataire } = await supabase.from('prestataires').select('id').eq('user_id', data.user.id).single()
    if (prestataire) { router.push('/prestataire/dashboard'); return }

    // Vérifier si cliente
    const { data: cliente } = await supabase.from('clientes').select('id').eq('user_id', data.user.id).single()
    if (cliente) { router.push('/cliente/accueil'); return }

    // Ni l'un ni l'autre — envoyer vers register
    router.push('/auth/register')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{color:'#FF80B5'}}>GlamBook</Link>
          <p className="text-gray-500 mt-2 text-sm">Connectez-vous à votre espace</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Connexion</h1>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none"
                placeholder="ton@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none"
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-50"
              style={{backgroundColor:'#FF80B5'}}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="font-medium hover:underline" style={{color:'#FF80B5'}}>S'inscrire gratuitement</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
