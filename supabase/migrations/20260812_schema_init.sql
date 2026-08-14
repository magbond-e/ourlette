-- ==============================================================================
-- MIGRATION INITIALE — OURLETTE (Supabase PostgreSQL + PowerSync Sync Rules)
-- ==============================================================================

-- 1. EXTENSIONS & DÉCLENCHEURS (UPDATED_AT)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TABLE COUTURIERS
CREATE TABLE IF NOT EXISTS public.couturiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    nom_atelier TEXT NOT NULL,
    email TEXT UNIQUE,
    telephone TEXT UNIQUE,
    whatsapp_contact TEXT,
    ville TEXT,
    pays TEXT,
    langue TEXT DEFAULT 'fr',
    devise TEXT DEFAULT 'FCFA',
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    slug_vitrine TEXT UNIQUE NOT NULL,
    vitrine_active BOOLEAN DEFAULT TRUE,
    notifications_email BOOLEAN DEFAULT TRUE,
    notif_rappel_livraison BOOLEAN DEFAULT TRUE,
    notif_retard BOOLEAN DEFAULT TRUE,
    statut_compte TEXT DEFAULT 'actif' CHECK (statut_compte IN ('actif', 'suspendu')),
    plan_change_manuel BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_couturiers_updated_at
BEFORE UPDATE ON public.couturiers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. TABLE CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    notes TEXT,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_clients_couturier_id ON public.clients(couturier_id);

-- 4. TABLE MESURES
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
    date_maj TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mesures_client_id ON public.mesures(client_id);

-- 5. TABLE COMMANDES
CREATE TABLE IF NOT EXISTS public.commandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    type_commande TEXT CHECK (type_commande IN ('couture_complete', 'retouche')),
    description TEXT,
    tissu TEXT,
    responsable TEXT,
    prix_total NUMERIC DEFAULT 0,
    acompte NUMERIC DEFAULT 0,
    versements JSONB DEFAULT '[]'::jsonb,
    statut TEXT DEFAULT 'recue' CHECK (statut IN ('recue', 'en_cours', 'essayage', 'prete', 'livree')),
    date_commande TIMESTAMPTZ DEFAULT NOW(),
    date_livraison_prevue DATE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_commandes_updated_at
BEFORE UPDATE ON public.commandes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_commandes_couturier_id ON public.commandes(couturier_id);
CREATE INDEX IF NOT EXISTS idx_commandes_client_id ON public.commandes(client_id);

-- 6. TABLE RÉALISATIONS (VITRINE)
CREATE TABLE IF NOT EXISTS public.realisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    description TEXT,
    commande_id UUID REFERENCES public.commandes(id) ON DELETE SET NULL,
    date_publication TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realisations_couturier_id ON public.realisations(couturier_id);

-- 7. POLITIQUES ROW LEVEL SECURITY (RLS)
ALTER TABLE public.couturiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;

-- Couturiers : accès en écriture/lecture par le propriétaire
CREATE POLICY "Couturier proprietaire acces total" ON public.couturiers
    FOR ALL USING (auth.uid() = id);

-- Couturiers : lecture publique du profil pour la vitrine
CREATE POLICY "Vitrine publique lecture couturier" ON public.couturiers
    FOR SELECT USING (true);

-- Clients : accès réservé au couturier propriétaire
CREATE POLICY "Clients couturier acces total" ON public.clients
    FOR ALL USING (auth.uid() = couturier_id);

-- Mesures : accès via le client appartenant au couturier
CREATE POLICY "Mesures couturier acces total" ON public.mesures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE public.clients.id = public.mesures.client_id
            AND public.clients.couturier_id = auth.uid()
        )
    );

-- Commandes : accès réservé au couturier propriétaire
CREATE POLICY "Commandes couturier acces total" ON public.commandes
    FOR ALL USING (auth.uid() = couturier_id);

-- Réalisations : accès total par le couturier propriétaire
CREATE POLICY "Realisations couturier acces total" ON public.realisations
    FOR ALL USING (auth.uid() = couturier_id);

-- Réalisations : lecture publique pour la vitrine
CREATE POLICY "Realisations lecture publique" ON public.realisations
    FOR SELECT USING (true);

-- 8. PUBLICATION POWERSYNC & REPLICA IDENTITY (POURS POWERSYNC CDC)
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.mesures REPLICA IDENTITY FULL;
ALTER TABLE public.commandes REPLICA IDENTITY FULL;

-- Publication Supabase pour la synchronisation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
        CREATE PUBLICATION powersync FOR TABLE public.clients, public.mesures, public.commandes;
    END IF;
END $$;
