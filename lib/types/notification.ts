export type NotificationType = 
  | 'welcome'
  | 'order_created'
  | 'order_status'
  | 'order_overdue'
  | 'order_due_soon'
  | 'payment_received'
  | 'client_created'
  | 'feature_update'
  | 'system';

export type NotificationCategory = 'order' | 'payment' | 'client' | 'system' | 'account';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationItem {
  id: string;
  couturier_id?: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  date: string; // ISO string representing creation date
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  orderId?: string;
  dedupe_key?: string;
  seen_at?: string | null;
  read_at?: string | null;
  dismissed_at?: string | null;
  resolved_at?: string | null;
  expires_at?: string | null;
  action_url?: string;
  data?: Record<string, any>;
}

export interface CreateNotificationInput {
  couturier_id?: string;
  type: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  read?: boolean;
  metadata?: Record<string, any>;
  orderId?: string;
  dedupe_key?: string;
  seen_at?: string | null;
  read_at?: string | null;
  dismissed_at?: string | null;
  resolved_at?: string | null;
  expires_at?: string | null;
  action_url?: string;
  data?: Record<string, any>;
}

export interface NotificationSettings {
  notifEmail: boolean;
  notifRetard: boolean;
  notifRappelLivraison: boolean;
  notifNouveautes: boolean;
}
