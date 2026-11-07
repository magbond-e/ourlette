-- ==============================================================================
-- MISE À JOUR ET SYNCHRONISATION SUPABASE — OURLETTE
-- Exécuter ce script dans : Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Ajout des colonnes indispensables sur public.couturiers
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'FCFA';
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS whatsapp_contact TEXT;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS adresse_atelier TEXT;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS couverture_url TEXT;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS vitrine_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS notif_nouveautes BOOLEAN DEFAULT TRUE;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS statut_compte VARCHAR(20) DEFAULT 'actif';
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Porto-Novo';
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS onboarding_emails_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS relance_j2_sent_at TIMESTAMPTZ;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS relance_j5_sent_at TIMESTAMPTZ;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS relance_j7_sent_at TIMESTAMPTZ;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN DEFAULT FALSE;
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(100);
ALTER TABLE public.couturiers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Table des préférences de notification
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
  categorie VARCHAR(50) NOT NULL,
  canal VARCHAR(20) NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_couturier_cat_canal UNIQUE (couturier_id, categorie, canal)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Les couturiers gerent leurs preferences'
  ) THEN
    CREATE POLICY "Les couturiers gerent leurs preferences"
      ON public.notification_preferences
      FOR ALL
      USING (auth.uid() = couturier_id)
      WITH CHECK (auth.uid() = couturier_id);
  END IF;
END $$;

-- 3. Trigger automatique pour créer la fiche du couturier lors d'une connexion Google ou Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_nom text;
  v_atelier text;
  v_slug text;
BEGIN
  v_nom := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'nom',
    'Artisan Couturier'
  );
  v_atelier := COALESCE(
    new.raw_user_meta_data->>'nom_atelier',
    'Mon Atelier'
  );
  v_slug := 'atelier-' || substr(md5(random()::text || new.id::text), 1, 6);

  INSERT INTO public.couturiers (
    id,
    email,
    nom,
    nom_atelier,
    slug_vitrine,
    pays,
    devise,
    plan,
    statut_compte,
    date_creation
  )
  VALUES (
    new.id,
    new.email,
    v_nom,
    v_atelier,
    v_slug,
    'Bénin',
    'FCFA',
    'free',
    'actif',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Rétro-remplissage des fiches couturiers pour les comptes déjà créés
INSERT INTO public.couturiers (id, email, nom, nom_atelier, slug_vitrine, pays, devise, plan, statut_compte)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Artisan Couturier'),
  COALESCE(u.raw_user_meta_data->>'nom_atelier', 'Mon Atelier'),
  'atelier-' || substr(md5(random()::text || u.id::text), 1, 6),
  'Bénin',
  'FCFA',
  'free',
  'actif'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

