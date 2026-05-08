-- =============================================
-- GLAMBOOK - Schéma Supabase complet
-- À coller dans l'éditeur SQL de Supabase
-- =============================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLE : prestataires
-- =============================================
create table prestataires (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  email text unique not null,
  telephone text,
  bio text,
  adresse text,
  ville text,
  code_postal text,
  photo_url text,
  instagram text,
  tiktok text,
  plan text default 'starter' check (plan in ('starter', 'pro', 'salon')),
  actif boolean default true,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE : horaires
-- =============================================
create table horaires (
  id uuid primary key default uuid_generate_v4(),
  prestataire_id uuid references prestataires(id) on delete cascade,
  jour int not null check (jour between 0 and 6), -- 0=Lundi, 6=Dimanche
  ouvert boolean default true,
  heure_debut time default '09:00',
  heure_fin time default '19:00'
);

-- =============================================
-- TABLE : prestations
-- =============================================
create table prestations (
  id uuid primary key default uuid_generate_v4(),
  prestataire_id uuid references prestataires(id) on delete cascade,
  nom text not null,
  description text,
  duree_minutes int not null default 60,
  prix decimal(10,2) not null,
  acompte decimal(10,2) default 0,
  categorie text default 'Autre',
  actif boolean default true,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE : clientes
-- =============================================
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  prestataire_id uuid references prestataires(id) on delete cascade,
  nom text not null,
  prenom text not null,
  email text,
  telephone text,
  date_naissance date,
  notes_privees text, -- notes visibles seulement par la prestataire
  allergies text,
  premiere_visite date,
  nb_prestations int default 0,
  ca_total decimal(10,2) default 0,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE : rendez_vous
-- =============================================
create table rendez_vous (
  id uuid primary key default uuid_generate_v4(),
  prestataire_id uuid references prestataires(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  prestation_id uuid references prestations(id) on delete set null,
  date_rdv date not null,
  heure_debut time not null,
  heure_fin time not null,
  statut text default 'en_attente' check (statut in ('en_attente', 'confirme', 'termine', 'annule', 'no_show')),
  prix_total decimal(10,2),
  acompte_montant decimal(10,2) default 0,
  acompte_paye boolean default false,
  stripe_payment_intent text,
  notes text,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE : journal_prestations
-- (carnet de soin privé par cliente)
-- =============================================
create table journal_prestations (
  id uuid primary key default uuid_generate_v4(),
  rdv_id uuid references rendez_vous(id) on delete cascade,
  prestataire_id uuid references prestataires(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete cascade,
  prestation_nom text,
  date_prestation date,
  notes_prestataire text, -- ce que la prestataire a fait/observé
  produits_utilises text,
  resultat text,
  recommandations text,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE : liste_attente
-- =============================================
create table liste_attente (
  id uuid primary key default uuid_generate_v4(),
  prestataire_id uuid references prestataires(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete cascade,
  prestation_id uuid references prestations(id) on delete set null,
  disponibilites jsonb default '{"matin": true, "apres_midi": true, "soir": false}',
  position int,
  notifiee boolean default false,
  notifiee_at timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE : messages
-- (chat cliente ↔ prestataire)
-- =============================================
create table messages (
  id uuid primary key default uuid_generate_v4(),
  prestataire_id uuid references prestataires(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete cascade,
  expediteur text not null check (expediteur in ('prestataire', 'cliente')),
  contenu text not null,
  lu boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE : avis
-- =============================================
create table avis (
  id uuid primary key default uuid_generate_v4(),
  prestataire_id uuid references prestataires(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete cascade,
  rdv_id uuid references rendez_vous(id) on delete set null,
  note int check (note between 1 and 5),
  commentaire text,
  valide boolean default true,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE : notifications
-- =============================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  destinataire_id uuid references auth.users(id) on delete cascade,
  type text not null, -- 'nouveau_rdv', 'annulation', 'acompte', 'message', 'creneau_libre'
  titre text not null,
  corps text,
  lu boolean default false,
  data jsonb,
  created_at timestamptz default now()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table prestataires enable row level security;
alter table horaires enable row level security;
alter table prestations enable row level security;
alter table clientes enable row level security;
alter table rendez_vous enable row level security;
alter table journal_prestations enable row level security;
alter table liste_attente enable row level security;
alter table messages enable row level security;
alter table avis enable row level security;
alter table notifications enable row level security;

-- Prestataires : lecture publique, écriture par soi-même
create policy "Lecture publique prestataires" on prestataires for select using (true);
create policy "Prestataire gère son profil" on prestataires for all using (auth.uid() = user_id);

-- Prestations : lecture publique, écriture par prestataire
create policy "Lecture publique prestations" on prestations for select using (true);
create policy "Prestataire gère ses prestations" on prestations for all
  using (prestataire_id in (select id from prestataires where user_id = auth.uid()));

-- RDV : prestataire voit les siens, cliente voit les siens
create policy "Prestataire voit ses RDV" on rendez_vous for all
  using (prestataire_id in (select id from prestataires where user_id = auth.uid()));
create policy "Cliente voit ses RDV" on rendez_vous for select
  using (cliente_id in (select id from clientes where user_id = auth.uid()));

-- Messages : prestataire et cliente concernés
create policy "Accès messages" on messages for all
  using (
    prestataire_id in (select id from prestataires where user_id = auth.uid())
    or cliente_id in (select id from clientes where user_id = auth.uid())
  );

-- Notifications : chacun voit les siennes
create policy "Notifications personnelles" on notifications for all
  using (destinataire_id = auth.uid());

-- Journal : prestataire seulement
create policy "Journal prestataire" on journal_prestations for all
  using (prestataire_id in (select id from prestataires where user_id = auth.uid()));

-- Avis : lecture publique
create policy "Lecture publique avis" on avis for select using (valide = true);
create policy "Cliente laisse un avis" on avis for insert
  using (cliente_id in (select id from clientes where user_id = auth.uid()));

-- =============================================
-- FONCTIONS UTILES
-- =============================================

-- Fonction : position dans la liste d'attente
create or replace function get_position_attente(p_id uuid, prest_id uuid)
returns int as $$
  select count(*)::int + 1
  from liste_attente
  where prestataire_id = p_id
    and prestation_id = prest_id
    and active = true
    and created_at < (select created_at from liste_attente where id = get_position_attente.prest_id limit 1)
$$ language sql;

-- Trigger : mettre à jour nb_prestations et ca_total sur la cliente
create or replace function update_cliente_stats()
returns trigger as $$
begin
  if NEW.statut = 'termine' then
    update clientes
    set nb_prestations = nb_prestations + 1,
        ca_total = ca_total + NEW.prix_total
    where id = NEW.cliente_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_update_cliente_stats
after update on rendez_vous
for each row
when (OLD.statut != 'termine' and NEW.statut = 'termine')
execute function update_cliente_stats();
