'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-brand-500">GlamBook</div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Connexion
          </Link>
          <Link href="/auth/register" className="px-4 py-2 text-sm bg-pink-500 text-white rounded-lg hover:bg-brand-600 font-medium">
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-pink-50 text-brand-600 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          ✨ La plateforme beauté pensée pour vous
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Le Doctolib de la beauté,<br/>
          <span className="text-brand-500">enfin fait pour vous</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Réservation en ligne, acomptes automatiques, fiche cliente privée, liste d'attente intelligente. 
          Tout ce que Planity ne fait pas.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/register?role=prestataire" className="px-8 py-4 bg-pink-500 text-white rounded-xl font-semibold text-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200">
            Je suis prestataire →
          </Link>
          <Link href="/auth/register?role=cliente" className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200">
            Je suis cliente
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📅', title: 'Réservation en ligne', desc: 'Vos clientes réservent 24h/24 avec paiement d\'acompte intégré. Fini les no-shows.' },
              { icon: '🔔', title: 'Liste d\'attente auto', desc: 'Une cliente annule ? Toutes celles en attente sont notifiées instantanément. Aucun créneau perdu.' },
              { icon: '📋', title: 'Fiche cliente privée', desc: 'Allergies, préférences, historique complet de chaque prestation. Votre carnet de soin numérique.' },
              { icon: '💬', title: 'Chat intégré', desc: 'Vos clientes vous contactent directement dans l\'app. Plus de WhatsApp perdu dans les notifications.' },
              { icon: '💳', title: 'Acomptes sécurisés', desc: 'Stripe gère les paiements. L\'acompte est retenu en cas d\'annulation tardive. Votre temps est protégé.' },
              { icon: '⭐', title: 'Avis vérifiés', desc: 'Seules vos vraies clientes peuvent laisser un avis. Construisez votre réputation en ligne.' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Tarifs simples</h2>
          <p className="text-center text-gray-500 mb-14">Commencez gratuitement, évoluez quand vous êtes prête.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter', price: '0 €', period: '/mois',
                desc: 'Pour tester',
                features: ['30 RDV/mois', 'Réservation en ligne', 'Agenda', '1 prestataire'],
                cta: 'Commencer', highlight: false
              },
              {
                name: 'Pro ✨', price: '19 €', period: '/mois',
                desc: 'Le plus populaire',
                features: ['RDV illimités', 'Acomptes Stripe', 'SMS + Email auto', 'Liste d\'attente', 'Fiche cliente', 'Chat', 'Avis'],
                cta: 'Choisir Pro', highlight: true
              },
              {
                name: 'Salon', price: '39 €', period: '/mois',
                desc: 'Pour les équipes',
                features: ['Tout Pro inclus', 'Jusqu\'à 3 prestataires', 'Stats avancées', 'Page salon perso', 'Support prioritaire'],
                cta: 'Choisir Salon', highlight: false
              },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl p-6 border-2 ${p.highlight ? 'border-brand-500 bg-pink-50 shadow-xl shadow-brand-100' : 'border-gray-200 bg-white'}`}>
                {p.highlight && <div className="text-xs font-bold text-brand-600 mb-3 uppercase tracking-wide">⭐ Recommandé</div>}
                <div className="text-lg font-bold text-gray-900 mb-1">{p.name}</div>
                <div className="text-sm text-gray-400 mb-3">{p.desc}</div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{p.price}</span>
                  <span className="text-gray-400 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register?role=prestataire" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${p.highlight ? 'bg-pink-500 text-white hover:bg-brand-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-10 px-6 text-center text-sm text-gray-400">
        <div className="font-bold text-brand-500 text-lg mb-2">GlamBook</div>
        <p>La plateforme beauté pensée par et pour les prestataires.</p>
        <div className="flex gap-6 justify-center mt-4">
          <Link href="/mentions-legales" className="hover:text-gray-600">Mentions légales</Link>
          <Link href="/cgv" className="hover:text-gray-600">CGV</Link>
          <Link href="/contact" className="hover:text-gray-600">Contact</Link>
        </div>
      </footer>

    </div>
  )
}
