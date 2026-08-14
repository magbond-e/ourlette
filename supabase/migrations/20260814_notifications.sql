-- ==============================================================================
-- MIGRATION NOTIFICATIONS — OURLETTE
-- Table `public.notifications` avec Row Level Security (RLS) et Realtime
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couturier_id UUID NOT NULL REFERENCES public.couturiers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'welcome', 'order_created', 'order_status', 'order_overdue', 'order_due_soon', 'payment_received', 'client_created', 'feature_update', 'system'
    category TEXT NOT NULL DEFAULT 'order', -- 'order', 'payment', 'client', 'system', 'account'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour la mise à jour automatique du champ updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index pour des performances optimales
CREATE INDEX IF NOT EXISTS idx_notifications_couturier_id ON public.notifications(couturier_id);
CREATE INDEX IF NOT EXISTS idx_notifications_couturier_created ON public.notifications(couturier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_couturier_read ON public.notifications(couturier_id, read);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Les couturiers peuvent lire leurs propres notifications
DROP POLICY IF EXISTS "Les couturiers lisent leurs propres notifications" ON public.notifications;
CREATE POLICY "Les couturiers lisent leurs propres notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = couturier_id);

-- 2. Les couturiers peuvent insérer leurs propres notifications
DROP POLICY IF EXISTS "Les couturiers créent leurs propres notifications" ON public.notifications;
CREATE POLICY "Les couturiers créent leurs propres notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = couturier_id);

-- 3. Les couturiers peuvent mettre à jour (marquer comme lu) leurs notifications
DROP POLICY IF EXISTS "Les couturiers modifient leurs propres notifications" ON public.notifications;
CREATE POLICY "Les couturiers modifient leurs propres notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = couturier_id);

-- 4. Les couturiers peuvent supprimer leurs notifications
DROP POLICY IF EXISTS "Les couturiers suppriment leurs propres notifications" ON public.notifications;
CREATE POLICY "Les couturiers suppriment leurs propres notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = couturier_id);

-- 5. Admins ont accès complet
DROP POLICY IF EXISTS "Admins voient toutes les notifications" ON public.notifications;
CREATE POLICY "Admins voient toutes les notifications"
    ON public.notifications FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    );

-- ==============================================================================
-- ACTIVATION DE SUPABASE REALTIME
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- Si la publication supabase_realtime n'existe pas dans l'environnement
        NULL;
END $$;
