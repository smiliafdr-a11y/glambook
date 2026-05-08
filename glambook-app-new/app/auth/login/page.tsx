'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme'

export default function LoginPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
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

    const { data: prestataire } = await supabase.from('prestataires').select('id').eq('user_id', data.user.id).single()
    if (prestataire) { router.push('/prestataire/dashboard'); return }

    const { data: cliente } = await supabase.from('clientes').select('id').eq('user_id', data.user.id).single()
    if (cliente) { router.push('/cliente/accueil'); return }

    router.push('/auth/register')
  }

  return (
    <div className="anim-up min-h-screen flex flex-col items-center justify-center px-6 relative" style={{ background: 'var(--bg)' }}>
      {/* Theme toggle */}
      <button onClick={toggle} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 9, background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)' }}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>✦ Glambook</div>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>Bon retour</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>Connectez-vous à votre espace</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 26, boxShadow: 'var(--shadow)' }}>
          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com" required
                style={{ width: '100%', padding: '11px 14px', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Mot de passe</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', padding: '11px 14px', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px 18px', background: loading ? 'var(--accent-mid)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <Link href="/cliente/accueil">
            <button style={{ width: '100%', padding: '11px 18px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent-mid)', borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Démo cliente rapide →
            </button>
          </Link>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text2)' }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>S'inscrire</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link href="/prestataire/dashboard" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
            Accès espace prestataire →
          </Link>
        </div>
      </div>
    </div>
  )
}
