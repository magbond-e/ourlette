-- ============================================================
-- SCHÉMA DE BASE DE DONNÉES SUPABASE — OURLETTE
-- SaaS Gratuit pour Couturiers (Isolé par utilisateur avec RLS)
-- ============================================================

-- Function to handle updated_at timestamps automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Table `couturiers`
CREATE TABLE IF NOT EXISTS public.couturiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  nom_atelier TEXT NOT NULL,
  email TEXT UNIQUE,
  telephone TEXT UNIQUE,
  whatsapp_contact TEXT,
  ville TEXT,
  pays TEXT,
  adresse_atelier TEXT,
  bio TEXT,
  langue TEXT DEFAULT 'fr',
  devise TEXT DEFAULT 'FCFA',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  statut_compte TEXT DEFAULT 'actif' CHECK (statut_compte IN ('actif', 'suspendu')),
  plan_change_manuel BOOLEAN DEFAULT false,
  slug_vitrine TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  cover_url TEXT,
  vitrine_active BOOLEAN DEFAULT true,
  cookie_consent_at TIMESTAMPTZ,
  notifications_email BOOLEAN DEFAULT true,
  notif_rappel_livraison BOOLEAN DEFAULT true,
  notif_retard BOOLEAN DEFAULT true,
  date_creation TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at for couturiers
DROP TRIGGER IF EXISTS set_couturiers_updated_at ON public.couturiers;
CREATE TRIGGER set_couturiers_updated_at
  BEFORE UPDATE ON public.couturiers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Table `clients`
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  notes TEXT,
  date_creation TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at for clients
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Table `mesures`
CREATE TABLE IF NOT EXISTS public.mesures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tour_poitrine NUMERIC,
  tour_taille NUMERIC,
  tour_hanches NUMERIC,
  longueur_manche NUMERIC,
  longueur_robe NUMERIC,
  tour_cou NUMERIC,
  largeur_epaules NUMERIC,
  champs_personnalises JSONB DEFAULT '{}'::jsonb,
  prise_par TEXT,
  date_maj TIMESTAMPTZ DEFAULT now()
);

-- 4. Table `commandes`
CREATE TABLE IF NOT EXISTS public.commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type_commande TEXT CHECK (type_commande IN ('couture_complete', 'retouche')) DEFAULT 'couture_complete',
  description TEXT NOT NULL,
  tissu TEXT,
  responsable TEXT,
  prix_total NUMERIC NOT NULL DEFAULT 0,
  acompte NUMERIC NOT NULL DEFAULT 0,
  versements JSONB DEFAULT '[]'::jsonb,
  statut TEXT CHECK (statut IN ('recue', 'en_cours', 'essayage', 'prete', 'livree')) DEFAULT 'recue',
  date_commande TIMESTAMPTZ DEFAULT now(),
  date_livraison_prevue DATE NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at for commandes
DROP TRIGGER IF EXISTS set_commandes_updated_at ON public.commandes;
CREATE TRIGGER set_commandes_updated_at
  BEFORE UPDATE ON public.commandes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Table `realisations`
CREATE TABLE IF NOT EXISTS public.realisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  commande_id UUID REFERENCES public.commandes(id) ON DELETE SET NULL,
  date_publication TIMESTAMPTZ DEFAULT now()
);

-- 6. Table `admins`
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  date_creation TIMESTAMPTZ DEFAULT now()
);

-- 7. Table `codes_promo`
CREATE TABLE IF NOT EXISTS public.codes_promo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('pourcentage', 'montant_fixe')) NOT NULL DEFAULT 'pourcentage',
  valeur NUMERIC NOT NULL,
  plan_concerne TEXT DEFAULT 'pro',
  date_debut TIMESTAMPTZ DEFAULT now(),
  date_expiration TIMESTAMPTZ,
  nombre_utilisation_max INTEGER,
  nombre_utilisation_actuel INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMPTZ DEFAULT now()
);

-- 8. Table `abonnements`
CREATE TABLE IF NOT EXISTS public.abonnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'pro',
  montant NUMERIC NOT NULL DEFAULT 2999,
  devise TEXT NOT NULL DEFAULT 'FCFA',
  code_promo_utilise UUID REFERENCES public.codes_promo(id),
  transaction_id TEXT,
  date_debut TIMESTAMPTZ DEFAULT now(),
  date_fin TIMESTAMPTZ,
  statut TEXT CHECK (statut IN ('actif', 'annule', 'expire')) DEFAULT 'actif',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Table `admin_logs`
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  cible_type TEXT CHECK (cible_type IN ('couturier', 'code_promo', 'abonnement')),
  cible_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  date_action TIMESTAMPTZ DEFAULT now()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_clients_couturier_id ON public.clients(couturier_id);
CREATE INDEX IF NOT EXISTS idx_commandes_couturier_id ON public.commandes(couturier_id);
CREATE INDEX IF NOT EXISTS idx_commandes_client_id ON public.commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_mesures_client_id ON public.mesures(client_id);
CREATE INDEX IF NOT EXISTS idx_realisations_couturier_id ON public.realisations(couturier_id);
CREATE INDEX IF NOT EXISTS idx_couturiers_slug ON public.couturiers(slug_vitrine);
CREATE INDEX IF NOT EXISTS idx_abonnements_couturier_id ON public.abonnements(couturier_id);
CREATE INDEX IF NOT EXISTS idx_codes_promo_code ON public.codes_promo(code);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.couturiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes_promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Couturiers
DROP POLICY IF EXISTS "Les couturiers peuvent lire et modifier leur propre profil" ON public.couturiers;
CREATE POLICY "Les couturiers peuvent lire et modifier leur propre profil"
  ON public.couturiers FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Lecture publique restreinte des couturiers pour la vitrine" ON public.couturiers;
CREATE POLICY "Lecture publique restreinte des couturiers pour la vitrine"
  ON public.couturiers FOR SELECT USING (true);

-- Clients
DROP POLICY IF EXISTS "Les couturiers ne voient et modifient que leurs clients" ON public.clients;
CREATE POLICY "Les couturiers ne voient et modifient que leurs clients"
  ON public.clients FOR ALL USING (auth.uid() = couturier_id);

-- Mesures
DROP POLICY IF EXISTS "Les couturiers ne voient et modifient que les mesures de leurs clients" ON public.mesures;
CREATE POLICY "Les couturiers ne voient et modifient que les mesures de leurs clients"
  ON public.mesures FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = mesures.client_id 
      AND clients.couturier_id = auth.uid()
    )
  );

-- Commandes
DROP POLICY IF EXISTS "Les couturiers ne voient et modifient que leurs commandes" ON public.commandes;
CREATE POLICY "Les couturiers ne voient et modifient que leurs commandes"
  ON public.commandes FOR ALL USING (auth.uid() = couturier_id);

-- Réalisations
DROP POLICY IF EXISTS "Les couturiers modifient leurs propres réalisations" ON public.realisations;
CREATE POLICY "Les couturiers modifient leurs propres réalisations"
  ON public.realisations FOR ALL USING (auth.uid() = couturier_id);

DROP POLICY IF EXISTS "Tout le monde peut voir les réalisations publiques" ON public.realisations;
CREATE POLICY "Tout le monde peut voir les réalisations publiques"
  ON public.realisations FOR SELECT USING (true);

-- Abonnements
DROP POLICY IF EXISTS "Les couturiers voient leurs abonnements" ON public.abonnements;
CREATE POLICY "Les couturiers voient leurs abonnements"
  ON public.abonnements FOR SELECT USING (auth.uid() = couturier_id);

-- Admins Access Policies
DROP POLICY IF EXISTS "Lecture réservée aux admins pour la table admins" ON public.admins;
CREATE POLICY "Lecture réservée aux admins pour la table admins"
  ON public.admins FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Accès total admins sur codes_promo" ON public.codes_promo;
CREATE POLICY "Accès total admins sur codes_promo"
  ON public.codes_promo FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Lecture publique restreinte des codes promo valides" ON public.codes_promo;
CREATE POLICY "Lecture publique restreinte des codes promo valides"
  ON public.codes_promo FOR SELECT USING (actif = true);

DROP POLICY IF EXISTS "Accès total admins sur admin_logs" ON public.admin_logs;
CREATE POLICY "Accès total admins sur admin_logs"
  ON public.admin_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Direct Admin Policies on core tables for global view
DROP POLICY IF EXISTS "Admins voient tous les couturiers" ON public.couturiers;
CREATE POLICY "Admins voient tous les couturiers"
  ON public.couturiers FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins modifient tous les couturiers" ON public.couturiers;
CREATE POLICY "Admins modifient tous les couturiers"
  ON public.couturiers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins voient toutes les commandes" ON public.commandes;
CREATE POLICY "Admins voient toutes les commandes"
  ON public.commandes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins voient tous les abonnements" ON public.abonnements;
CREATE POLICY "Admins voient tous les abonnements"
  ON public.abonnements FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );


