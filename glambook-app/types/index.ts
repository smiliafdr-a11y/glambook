export type Plan = 'starter' | 'pro' | 'salon'
export type StatutRdv = 'en_attente' | 'confirme' | 'termine' | 'annule' | 'no_show'
export type Expediteur = 'prestataire' | 'cliente'

export interface Prestataire {
  id: string
  user_id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  bio?: string
  adresse?: string
  ville?: string
  code_postal?: string
  photo_url?: string
  instagram?: string
  tiktok?: string
  plan: Plan
  actif: boolean
  created_at: string
}

export interface Horaire {
  id: string
  prestataire_id: string
  jour: number // 0=Lundi, 6=Dimanche
  ouvert: boolean
  heure_debut: string
  heure_fin: string
}

export interface Prestation {
  id: string
  prestataire_id: string
  nom: string
  description?: string
  duree_minutes: number
  prix: number
  acompte: number
  categorie: string
  actif: boolean
  created_at: string
}

export interface Cliente {
  id: string
  user_id?: string
  prestataire_id: string
  nom: string
  prenom: string
  email?: string
  telephone?: string
  date_naissance?: string
  notes_privees?: string
  allergies?: string
  premiere_visite?: string
  nb_prestations: number
  ca_total: number
  created_at: string
}

export interface RendezVous {
  id: string
  prestataire_id: string
  cliente_id: string
  prestation_id: string
  date_rdv: string
  heure_debut: string
  heure_fin: string
  statut: StatutRdv
  prix_total: number
  acompte_montant: number
  acompte_paye: boolean
  stripe_payment_intent?: string
  notes?: string
  created_at: string
  // Joins
  cliente?: Cliente
  prestation?: Prestation
}

export interface JournalPrestation {
  id: string
  rdv_id: string
  prestataire_id: string
  cliente_id: string
  prestation_nom?: string
  date_prestation: string
  notes_prestataire?: string
  produits_utilises?: string
  resultat?: string
  recommandations?: string
  created_at: string
}

export interface ListeAttente {
  id: string
  prestataire_id: string
  cliente_id: string
  prestation_id: string
  disponibilites: {
    matin: boolean
    apres_midi: boolean
    soir: boolean
  }
  position: number
  notifiee: boolean
  active: boolean
  created_at: string
  cliente?: Cliente
  prestation?: Prestation
}

export interface Message {
  id: string
  prestataire_id: string
  cliente_id: string
  expediteur: Expediteur
  contenu: string
  lu: boolean
  created_at: string
  cliente?: Cliente
}

export interface Avis {
  id: string
  prestataire_id: string
  cliente_id: string
  rdv_id?: string
  note: number
  commentaire?: string
  valide: boolean
  created_at: string
  cliente?: Cliente
}

export interface Notification {
  id: string
  destinataire_id: string
  type: string
  titre: string
  corps?: string
  lu: boolean
  data?: Record<string, unknown>
  created_at: string
}

export interface DayStats {
  total_rdv: number
  confirmes: number
  ca_prevu: number
  acomptes: number
}
