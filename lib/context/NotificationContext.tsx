'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { DataService } from '../services/dataService';
import { NotificationItem, CreateNotificationInput } from '../types/notification';
import { createClient } from '../supabase/client';
import { NotificationToast } from '@/components/ui/NotificationToast';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  createNotification: (input: CreateNotificationInput) => Promise<NotificationItem | null>;
  refreshNotifications: () => Promise<void>;
  triggerTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearAll: async () => {},
  createNotification: async () => null,
  refreshNotifications: async () => {},
  triggerTestNotification: async () => {},
});

/**
 * Soft synthetic audio chime for real-time notification alerts
 */
function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio permission or playback errors
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, couturier } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const initializedWelcomeRef = useRef<boolean>(false);

  // ── 1. Fetch & Synchronize Notifications from Backend ───────────────
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      // 1. Synchronize automated order alerts (overdue / due soon) once in backend
      await DataService.syncOrderAlerts(user.id, couturier);

      // 2. Fetch all persisted notifications for this account
      let list = await DataService.getNotifications(user.id);

      // 3. Ensure Welcome Notification exists once per account
      if (!initializedWelcomeRef.current && list.length === 0) {
        initializedWelcomeRef.current = true;
        const hasWelcome = list.some((n) => n.type === 'welcome');
        if (!hasWelcome) {
          const welcomeNotif = await DataService.addNotification(user.id, {
            type: 'welcome',
            category: 'account',
            priority: 'medium',
            title: '🎉 Bienvenue sur Ourlette !',
            message: `Heureux de vous compter parmi nous ${couturier?.nom_atelier ? `– ${couturier.nom_atelier}` : ''} ! Prenez en main la gestion de vos clients, commandes et vitrine d'atelier.`,
            link: '/parametres',
            read: false,
          });
          if (welcomeNotif) {
            list = [welcomeNotif, ...list];
          }
        }
      }

      setNotifications(list);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, couturier]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      refreshNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id, refreshNotifications]);

  // ── 2. Supabase Realtime Subscription ────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`notifications:couturier_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `couturier_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          if (!newRow) return;

          const item: NotificationItem = {
            id: newRow.id,
            couturier_id: newRow.couturier_id,
            type: newRow.type,
            category: newRow.category || 'order',
            priority: newRow.priority || 'medium',
            title: newRow.title,
            message: newRow.message,
            date: newRow.created_at || new Date().toISOString(),
            read: Boolean(newRow.read),
            link: newRow.link || undefined,
            metadata: newRow.metadata || {},
            orderId: newRow.metadata?.orderId || undefined,
          };

          setNotifications((prev) => {
            if (prev.some((n) => n.id === item.id)) return prev;
            return [item, ...prev];
          });

          // Show Toast & Play audio chime for live incoming notifications
          setActiveToast(item);
          playNotificationChime();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `couturier_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedRow = payload.new as any;
          if (!updatedRow) return;

          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedRow.id
                ? {
                    ...n,
                    read: Boolean(updatedRow.read),
                    title: updatedRow.title,
                    message: updatedRow.message,
                    link: updatedRow.link || undefined,
                  }
                : n
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `couturier_id=eq.${user.id}`,
        },
        (payload) => {
          const oldRow = payload.old as any;
          if (!oldRow?.id) return;
          setNotifications((prev) => prev.filter((n) => n.id !== oldRow.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ── 3. Actions ───────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    if (!user?.id) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await DataService.markNotificationAsRead(user.id, id);
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await DataService.markAllNotificationsAsRead(user.id);
  };

  const deleteNotification = async (id: string) => {
    if (!user?.id) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await DataService.deleteNotification(user.id, id);
  };

  const clearAll = async () => {
    if (!user?.id) return;
    setNotifications([]);
    await DataService.clearAllNotifications(user.id);
  };

  const createNotification = async (input: CreateNotificationInput): Promise<NotificationItem | null> => {
    if (!user?.id) return null;
    const created = await DataService.addNotification(user.id, input);
    if (created) {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === created.id)) return prev;
        return [created, ...prev];
      });
      setActiveToast(created);
      playNotificationChime();
    }
    return created;
  };

  const triggerTestNotification = async () => {
    if (!user?.id) return;
    await createNotification({
      type: 'feature_update',
      category: 'system',
      priority: 'high',
      title: '🔔 Test Notification Réussi !',
      message: 'Le nouveau système de notification persistant et temps réel fonctionne parfaitement sur votre compte.',
      link: '/parametres',
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        createNotification,
        refreshNotifications,
        triggerTestNotification,
      }}
    >
      {children}
      {/* Global In-App Toast Banner */}
      <NotificationToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
        onRead={markAsRead}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
