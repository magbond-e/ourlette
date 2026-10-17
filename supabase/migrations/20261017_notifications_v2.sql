-- ==============================================================================
-- MIGRATION NOTIFICATIONS V2 — OURLETTE
-- Résolution des doublons, déduplication, préférences par catégorie et fuseau horaire
-- ==============================================================================

-- 0. Fonction utilitaire pour la mise à jour automatique de `updated_at` (au cas où elle n'existe pas)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Ajout des colonnes de gestion du cycle de vie et déduplication sur `notifications`
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
    ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 2. Index d'unicité pour garantir qu'un même événement n'est JAMAIS notifié deux fois
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_couturier_dedupe 
    ON public.notifications (couturier_id, dedupe_key) 
    WHERE dedupe_key IS NOT NULL;

-- 3. Index de performance pour les filtres courants
CREATE INDEX IF NOT EXISTS idx_notifications_couturier_seen 
    ON public.notifications (couturier_id, seen_at);
CREATE INDEX IF NOT EXISTS idx_notifications_couturier_dismissed 
    ON public.notifications (couturier_id, dismissed_at);

-- 4. Rétro-compatibilité : synchroniser `read_at` avec l'existant si déjà lu
UPDATE public.notifications 
SET read_at = updated_at 
WHERE read = TRUE AND read_at IS NULL;

-- 5. Table des préférences de notification par catégorie (in-app vs email)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'order', 'payment', 'client', 'system', 'account'
    in_app BOOLEAN NOT NULL DEFAULT TRUE,
    email BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notification_preferences_couturier_category UNIQUE (couturier_id, category)
);

-- Trigger pour mise à jour automatique de `updated_at`
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Ajout du fuseau horaire sur la table `couturiers` (défaut Afrique de l'Ouest / Bénin)
ALTER TABLE public.couturiers
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Porto-Novo';

-- ==============================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS) SUR LES PRÉFÉRENCES
-- ==============================================================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les couturiers lisent leurs propres preferences de notifications" ON public.notification_preferences;
CREATE POLICY "Les couturiers lisent leurs propres preferences de notifications"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = couturier_id);

DROP POLICY IF EXISTS "Les couturiers creent leurs propres preferences de notifications" ON public.notification_preferences;
CREATE POLICY "Les couturiers creent leurs propres preferences de notifications"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = couturier_id);

DROP POLICY IF EXISTS "Les couturiers modifient leurs propres preferences de notifications" ON public.notification_preferences;
CREATE POLICY "Les couturiers modifient leurs propres preferences de notifications"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = couturier_id);

DROP POLICY IF EXISTS "Les couturiers suppriment leurs propres preferences de notifications" ON public.notification_preferences;
CREATE POLICY "Les couturiers suppriment leurs propres preferences de notifications"
    ON public.notification_preferences FOR DELETE
    USING (auth.uid() = couturier_id);

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP POLICY IF EXISTS "Admins voient toutes les preferences de notifications" ON public.notification_preferences;
CREATE POLICY "Admins voient toutes les preferences de notifications"
    ON public.notification_preferences FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    );
