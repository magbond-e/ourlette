-- ==============================================================================
-- MIGRATION ONBOARDING RELANCES & NOTIFICATIONS — OURLETTE
-- Table: public.couturiers
-- ==============================================================================

-- 1. Ajout sécurisé des colonnes de relances, désinscription et métadonnées d'inscription
ALTER TABLE public.couturiers
ADD COLUMN IF NOT EXISTS onboarding_emails_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS relance_j2_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS relance_j5_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS relance_j7_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS device TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_ip TEXT DEFAULT NULL;

-- 2. Génération d'un unsubscribe_token aléatoire unique pour les utilisateurs existants
-- Les utilisateurs existants conservent strictement onboarding_emails_enabled = false
UPDATE public.couturiers
SET unsubscribe_token = encode(gen_random_bytes(24), 'hex')
WHERE unsubscribe_token IS NULL;

-- 3. Index d'unicité et de performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_couturiers_unsubscribe_token ON public.couturiers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_couturiers_onboarding_emails ON public.couturiers(onboarding_emails_enabled, email_opt_out);
