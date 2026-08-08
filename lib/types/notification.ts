export type NotificationType = 
  | 'welcome'
  | 'order_overdue'
  | 'order_due_soon'
  | 'feature_update'
  | 'system';

export type NotificationCategory = 'order' | 'system' | 'account';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  orderId?: string;
}

export interface NotificationSettings {
  notifEmail: boolean;
  notifRetard: boolean;
  notifRappelLivraison: boolean;
  notifNouveautes: boolean;
}
