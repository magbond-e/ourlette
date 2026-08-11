-- ============================================================
-- SCRIPT DE CONFIGURATION & ACTIVATION ACCÈS ADMIN
-- À copier/coller dans le SQL Editor de Supabase
-- ============================================================

-- 1. Vérification / Création de la table `admins`
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation du RLS sur la table admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 2. Correction des politiques RLS (évite les récursions bloquantes)
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

DROP POLICY IF EXISTS "Accès total admins sur admin_logs" ON public.admin_logs;
CREATE POLICY "Accès total admins sur admin_logs"
  ON public.admin_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- 3. Politiques RLS permettant aux Admins de lire/gérer la plateforme
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

-- 4. AJOUT DE VOTRE COMPTE COMPTE UTILISATEUR COMME ADMIN
-- Insère automatiquement tous les comptes utilisateurs enregistrés dans auth.users comme admins (environnement dev)
INSERT INTO public.admins (user_id, email, nom)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'nom', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 5. Vérifier que vous êtes bien enregistré dans la table admins
SELECT * FROM public.admins;
