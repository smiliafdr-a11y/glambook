'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* NAV */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="font-display" style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>✦ Glambook</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth/login" style={{ padding: '8px 16px', fontSize: 13, color: 'var(--text2)', textDecoration: 'none', borderRadius: 9, border: '1px solid var(--border)' }}>
            Connexion
          </Link>
          <Link href="/auth/register" style={{ padding: '8px 16px', fontSize: 13, background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 9, fontWeight: 600 }}>
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20, marginBottom: 24, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ✦ La plateforme beauté pensée pour vous
        </div>
        <h1 className="font-display" style={{ fontSize: 48, fontWeight: 600, color: 'var(--text)', marginBottom: 20, lineHeight: 1.15 }}>
          Le Doctolib de la beauté,<br />
          <span style={{ color: 'var(--accent)' }}>enfin fait pour vous</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', marginBottom: 36, maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Réservation en ligne, acomptes automatiques, fiche cliente privée, liste d'attente intelligente.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register?role=prestataire" style={{ padding: '14px 28px', background: 'var(--accent)', color: '#fff', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Je suis prestataire →
          </Link>
          <Link href="/auth/register?role=cliente" style={{ padding: '14px 28px', background: 'var(--card)', color: 'var(--text)', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1.5px solid var(--border)' }}>
            Je suis cliente
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: 'var(--bg2)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 className="font-display" style={{ fontSize: 30, fontWeight: 600, textAlign: 'center', color: 'var(--text)', marginBottom: 48 }}>
            Tout ce dont vous avez besoin
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { icon: '📅', title: 'Réservation en ligne', desc: 'Vos clientes réservent 24h/24 avec paiement d\'acompte intégré. Fini les no-shows.' },
              { icon: '🔔', title: 'Liste d\'attente auto', desc: 'Une cliente annule ? Toutes celles en attente sont notifiées instantanément.' },
              { icon: '📋', title: 'Fiche cliente privée', desc: 'Allergies, préférences, historique complet. Votre carnet de soin numérique.' },
              { icon: '💬', title: 'Chat intégré', desc: 'Vos clientes vous contactent directement dans l\'app. Plus de WhatsApp perdu.' },
              { icon: '💳', title: 'Acomptes sécurisés', desc: 'Stripe gère les paiements. L\'acompte est retenu en cas d\'annulation tardive.' },
              { icon: '⭐', title: 'Avis vérifiés', desc: 'Seules vos vraies clientes peuvent laisser un avis. Construisez votre réputation.' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'var(--card)', borderRadius: 16, padding: 22, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6, fontSize: 14 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>Glambook</div>
        <p>La plateforme beauté pensée par et pour les prestataires.</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 14 }}>
          <Link href="/mentions-legales" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Mentions légales</Link>
          <Link href="/cgv" style={{ color: 'var(--text3)', textDecoration: 'none' }}>CGV</Link>
          <Link href="/contact" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Contact</Link>
        </div>
      </footer>
    </div>
  )
}
