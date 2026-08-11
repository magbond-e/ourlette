-- ============================================================
-- MIGRATION : Ajout des colonnes manquantes à la table couturiers
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- Ajout de cookie_consent_at (manquante en base de données)
ALTER TABLE public.couturiers
  ADD COLUMN IF NOT EXISTS cookie_consent_at TIMESTAMPTZ;

-- Ajout de plan_change_manuel au cas où elle manquerait aussi
ALTER TABLE public.couturiers
  ADD COLUMN IF NOT EXISTS plan_change_manuel BOOLEAN DEFAULT false;

-- Ajout de notifications_email
ALTER TABLE public.couturiers
  ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT true;

-- Ajout de notif_rappel_livraison
ALTER TABLE public.couturiers
  ADD COLUMN IF NOT EXISTS notif_rappel_livraison BOOLEAN DEFAULT true;

-- Ajout de notif_retard
ALTER TABLE public.couturiers
  ADD COLUMN IF NOT EXISTS notif_retard BOOLEAN DEFAULT true;

-- Vérifier les colonnes maintenant présentes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'couturiers'
ORDER BY ordinal_position;
