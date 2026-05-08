# GlamBook 💅

Le Doctolib de la beauté — plateforme SaaS pensée pour les prestataires beauté.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (DB, Auth, Realtime)
- **Tailwind CSS**
- **TypeScript**

## Démarrer en 5 étapes

### 1. Créer ton projet Supabase
- Va sur [supabase.com](https://supabase.com) → New Project
- Dans l'éditeur SQL, copie-colle le contenu de `supabase_schema.sql` et exécute
- Récupère l'URL et la clé anon dans Settings → API

### 2. Configurer l'environnement
```bash
cp .env.local.example .env.local
```
Remplis les valeurs dans `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta-clé-anon
```

### 3. Installer et lancer
```bash
npm install
npm run dev
```
L'app tourne sur http://localhost:3000

### 4. Déployer sur Vercel
- Crée un compte sur [vercel.com](https://vercel.com)
- Connecte ton repo GitHub
- Ajoute les variables d'environnement dans Vercel → Settings → Environment Variables
- Deploy !

### 5. Activer l'auth email dans Supabase
- Authentication → Email → activer "Confirm email" si tu veux la vérification
- Providers → Email/Password → activé par défaut

## Structure des pages

```
app/
├── page.tsx                    # Landing page (glambook.fr)
├── auth/
│   ├── login/page.tsx          # Connexion
│   └── register/page.tsx       # Inscription prestataire/cliente
├── prestataire/
│   ├── layout.tsx              # Sidebar navigation
│   ├── dashboard/page.tsx      # Tableau de bord
│   ├── agenda/page.tsx         # Calendrier + RDV
│   ├── clientes/page.tsx       # Annuaire + fiche cliente
│   ├── prestations/page.tsx    # Gestion des prestations
│   └── liste-attente/page.tsx  # Liste d'attente
└── cliente/
    └── (à venir - session 2)
```

## Prochaines fonctionnalités (Session 2)
- [ ] Espace cliente complet (réservation, mes RDV, contact)
- [ ] Paiement acompte Stripe
- [ ] Notifications push OneSignal
- [ ] Chat temps réel Supabase Realtime
- [ ] Page publique prestataire (glambook.fr/nadia)
- [ ] Abonnements Stripe (Pro/Salon)
- [ ] SMS rappel via Brevo

## Tarifs GlamBook
| Plan | Prix | Limites |
|------|------|---------|
| Starter | 0 €/mois | 30 RDV/mois |
| Pro | 19 €/mois | Illimité + toutes fonctionnalités |
| Salon | 39 €/mois | Jusqu'à 3 prestataires |
