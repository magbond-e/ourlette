'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { DataService } from '../services/dataService';
import { Commande } from '../types/database';
import { NotificationItem } from '../types/notification';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
  addDemoNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  refreshNotifications: async () => {},
  addDemoNotification: () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, couturier } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [customNotifications, setCustomNotifications] = useState<NotificationItem[]>([]);

  // Load read notification IDs from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = user?.id || 'guest';
    try {
      const stored = localStorage.getItem(`ourlette_${userId}_read_notifs`);
      if (stored) {
        setReadIds(JSON.parse(stored));
      } else {
        setReadIds([]);
      }
    } catch {
      setReadIds([]);
    }
  }, [user?.id]);

  const saveReadIds = (newReadIds: string[]) => {
    setReadIds(newReadIds);
    if (typeof window === 'undefined') return;
    const userId = user?.id || 'guest';
    try {
      localStorage.setItem(`ourlette_${userId}_read_notifs`, JSON.stringify(newReadIds));
    } catch (e) {
      console.error('Failed to save read notifications state', e);
    }
  };

  const refreshNotifications = useCallback(async () => {
    const userId = user?.id || 'guest';
    const notifRetardEnabled = couturier?.notif_retard ?? true;
    const notifRappelEnabled = couturier?.notif_rappel_livraison ?? true;
    const notifNouveautesEnabled = couturier?.notif_nouveautes ?? true;

    // Fetch real orders
    const cmds: Commande[] = userId !== 'guest' ? await DataService.getCommandes(userId) : [];

    const generated: NotificationItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check Overdue & Upcoming Orders
    cmds.forEach((cmd) => {
      if (cmd.statut === 'livree') return;

      const datePrev = new Date(cmd.date_livraison_prevue);
      if (isNaN(datePrev.getTime())) return;

      datePrev.setHours(0, 0, 0, 0);
      const diffDays = Math.round((datePrev.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const formattedDate = new Date(cmd.date_livraison_prevue).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      if (diffDays < 0 && notifRetardEnabled) {
        // Overdue Order Notification
        const notifId = `notif-overdue-${cmd.id}`;
        generated.push({
          id: notifId,
          type: 'order_overdue',
          category: 'order',
          priority: 'urgent',
          title: '🚨 Commande en retard',
          message: `La commande pour ${cmd.client_nom || 'un client'} ("${cmd.description}") accuse ${Math.abs(diffDays)} jour(s) de retard (Échéance: ${formattedDate}).`,
          date: cmd.date_livraison_prevue,
          read: readIds.includes(notifId),
          link: `/commandes?id=${cmd.id}`,
          orderId: cmd.id,
        });
      } else if (diffDays >= 0 && diffDays <= 2 && notifRappelEnabled) {
        // Due Soon Order Notification
        const notifId = `notif-duesoon-${cmd.id}`;
        const label = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? "Demain" : `dans ${diffDays} jours`;
        generated.push({
          id: notifId,
          type: 'order_due_soon',
          category: 'order',
          priority: 'high',
          title: `⏰ Échéance proche (${label})`,
          message: `La commande pour ${cmd.client_nom || 'un client'} ("${cmd.description}") doit être livrée le ${formattedDate}.`,
          date: cmd.date_livraison_prevue,
          read: readIds.includes(notifId),
          link: `/commandes?id=${cmd.id}`,
          orderId: cmd.id,
        });
      }
    });

    // 2. Welcome Notification
    const welcomeId = `notif-welcome-${userId}`;
    generated.push({
      id: welcomeId,
      type: 'welcome',
      category: 'account',
      priority: 'medium',
      title: '🎉 Bienvenue sur Ourlette !',
      message: `Heureux de vous compter parmi nous ${couturier?.nom_atelier ? `– ${couturier.nom_atelier}` : ''} ! Prenez en main la gestion de vos clients, commandes et vitrine.`,
      date: couturier?.date_creation || new Date().toISOString(),
      read: readIds.includes(welcomeId),
      link: '/parametres',
    });

    // 3. New Feature / Update Notification
    if (notifNouveautesEnabled) {
      const updateId = 'notif-feature-v1-2';
      generated.push({
        id: updateId,
        type: 'feature_update',
        category: 'system',
        priority: 'low',
        title: '✨ Nouveauté Ourlette v1.2',
        message: "Notifications intelligentes activées ! Recevez désormais des rappels d'échéances et des alertes visuelles pour vos livraisons.",
        date: new Date().toISOString(),
        read: readIds.includes(updateId),
        link: '/parametres',
      });
    }

    // Combine generated with custom/demo notifications
    const all = [...generated, ...customNotifications].map((item) => ({
      ...item,
      read: item.read || readIds.includes(item.id),
    }));

    // Deduplicate by ID
    const unique = Array.from(new Map(all.map((item) => [item.id, item])).values());

    setNotifications(unique);
  }, [user?.id, couturier, readIds, customNotifications]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      saveReadIds(updated);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const combined = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(combined);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    markAllAsRead();
    setCustomNotifications([]);
  };

  const addDemoNotification = () => {
    const demoId = `notif-demo-${Date.now()}`;
    const newDemo: NotificationItem = {
      id: demoId,
      type: 'system',
      category: 'system',
      priority: 'high',
      title: '🔔 Notification de Test',
      message: 'Ceci est un test de notification généré à votre demande depuis les Paramètres !',
      date: new Date().toISOString(),
      read: false,
      link: '/parametres',
    };

    setCustomNotifications((prev) => [newDemo, ...prev]);
    setNotifications((prev) => [newDemo, ...prev]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        refreshNotifications,
        addDemoNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
