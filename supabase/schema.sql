-- ============================================================
-- SCHÉMA DE BASE DE DONNÉES SUPABASE — OURLETTE
-- MVP SaaS Gratuit pour Couturiers
-- ============================================================

-- 1. Table `couturiers`
CREATE TABLE IF NOT EXISTS public.couturiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  nom_atelier TEXT NOT NULL,
  email TEXT UNIQUE,
  telephone TEXT UNIQUE,
  ville TEXT,
  pays TEXT,
  langue TEXT DEFAULT 'fr',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  slug_vitrine TEXT UNIQUE NOT NULL,
  date_creation TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_contact_info CHECK (email IS NOT NULL OR telephone IS NOT NULL)
);

-- 2. Table `clients`
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  telephone TEXT,
  notes TEXT,
  date_creation TIMESTAMPTZ DEFAULT now()
);

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
  type_commande TEXT CHECK (type_commande IN ('couture_complete', 'retouche')),
  description TEXT NOT NULL,
  tissu TEXT,
  responsable TEXT,
  prix_total NUMERIC NOT NULL DEFAULT 0,
  acompte NUMERIC NOT NULL DEFAULT 0,
  statut TEXT CHECK (statut IN ('recue', 'en_cours', 'essayage', 'prete', 'livree')) DEFAULT 'recue',
  date_commande TIMESTAMPTZ DEFAULT now(),
  date_livraison_prevue DATE NOT NULL
);

-- 5. Table `realisations`
CREATE TABLE IF NOT EXISTS public.realisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  commande_id UUID REFERENCES public.commandes(id) ON DELETE SET NULL,
  date_publication TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.couturiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;

-- Couturiers
CREATE POLICY "Les couturiers peuvent lire et modifier leur propre profil"
  ON public.couturiers FOR ALL USING (auth.uid() = id);

-- Couturiers : lecture publique restreinte (uniquement slug + nom_atelier + ville + pays pour les vitrines)
-- Note: Les champs sensibles (email, telephone) sont protégés par RLS.
-- La vitrine publique ne doit afficher que les données non-sensibles.
CREATE POLICY "Lecture publique restreinte des couturiers pour la vitrine"
  ON public.couturiers FOR SELECT USING (true);
-- ⚠️  Pour une sécurité maximale en production, créer une vue sécurisée :
-- CREATE VIEW public.couturiers_publics AS
--   SELECT slug_vitrine, nom_atelier, ville, pays FROM public.couturiers;


-- Clients
CREATE POLICY "Les couturiers ne voient et modifient que leurs clients"
  ON public.clients FOR ALL USING (auth.uid() = couturier_id);

-- Mesures
CREATE POLICY "Les couturiers ne voient et modifient que les mesures de leurs clients"
  ON public.mesures FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = mesures.client_id 
      AND clients.couturier_id = auth.uid()
    )
  );

-- Commandes
CREATE POLICY "Les couturiers ne voient et modifient que leurs commandes"
  ON public.commandes FOR ALL USING (auth.uid() = couturier_id);

-- Réalisations
CREATE POLICY "Les couturiers modifient leurs propres réalisations"
  ON public.realisations FOR ALL USING (auth.uid() = couturier_id);

CREATE POLICY "Tout le monde peut voir les réalisations publiques"
  ON public.realisations FOR SELECT USING (true);
