'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertTriangle,
  Clock,
  Sparkles,
  PartyPopper,
  CheckCheck,
  Trash2,
  ChevronRight,
  X,
  DollarSign,
  Scissors,
  UserPlus,
  Check,
} from 'lucide-react';
import { useNotifications } from '@/lib/context/NotificationContext';
import { NotificationItem, NotificationType } from '@/lib/types/notification';

export const NotificationDropdown: React.FC = () => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'orders' | 'payments'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter notifications
  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter === 'orders') {
      return (
        item.category === 'order' ||
        item.type === 'order_created' ||
        item.type === 'order_status' ||
        item.type === 'order_overdue' ||
        item.type === 'order_due_soon'
      );
    }
    if (filter === 'payments') {
      return item.category === 'payment' || item.type === 'payment_received';
    }
    return true;
  });

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      await markAsRead(item.id);
    }
    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  const getItemIcon = (type: NotificationType) => {
    switch (type) {
      case 'order_overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />;
      case 'order_due_soon':
        return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'order_created':
      case 'order_status':
        return <Scissors className="w-4 h-4 text-accent shrink-0" />;
      case 'client_created':
        return <UserPlus className="w-4 h-4 text-sombre shrink-0" />;
      case 'welcome':
        return <PartyPopper className="w-4 h-4 text-accent shrink-0" />;
      case 'feature_update':
        return <Sparkles className="w-4 h-4 text-gold shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-sombre/70 shrink-0" />;
    }
  };

  const getItemBadgeBg = (type: NotificationType, read: boolean) => {
    if (read) return 'bg-[#F5F5F3] border-sable/50 text-sombre/60';
    switch (type) {
      case 'order_overdue':
        return 'bg-red-50 border-red-200 text-red-700 shadow-xs';
      case 'order_due_soon':
        return 'bg-amber-50 border-amber-200 text-amber-800 shadow-xs';
      case 'payment_received':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs';
      case 'welcome':
        return 'bg-accent/10 border-accent/20 text-accent shadow-xs';
      case 'feature_update':
        return 'bg-amber-500/10 border-amber-500/20 text-sombre shadow-xs';
      default:
        return 'bg-[#F7F7F5] border-sable/60 text-sombre';
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 2) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24 && d.toDateString() === now.toDateString()) {
        return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return `Hier à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      }

      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Bell Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-2.5 rounded-full bg-[#F7F7F5] border border-sable/50 text-sombre/80 hover:text-sombre hover:bg-white hover:border-accent/40 transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-accent/20"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />

        {/* Badge Count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-red-600 rounded-full border-2 border-white shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] max-w-[calc(100vw-24px)] bg-white border border-sable/60 rounded-3xl shadow-2xl z-50 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-[#FAF9F6] border-b border-sable/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-sombre font-display">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-extrabold bg-accent/15 text-accent rounded-full border border-accent/20">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-xs text-sombre/60 hover:text-accent font-semibold flex items-center gap-1 transition-colors rounded-lg hover:bg-white"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tout lire</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-sombre/40 hover:text-sombre rounded-full hover:bg-sable/30 transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2.5 pb-2 bg-white border-b border-sable/40 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'bg-[#F5F5F3] text-sombre/70 hover:bg-sable/40'
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filter === 'unread'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'bg-[#F5F5F3] text-sombre/70 hover:bg-sable/40'
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('orders')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filter === 'orders'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'bg-[#F5F5F3] text-sombre/70 hover:bg-sable/40'
              }`}
            >
              Commandes
            </button>
            <button
              onClick={() => setFilter('payments')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filter === 'payments'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'bg-[#F5F5F3] text-sombre/70 hover:bg-sable/40'
              }`}
            >
              Paiements
            </button>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-sable/30">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#FAFAF8] border border-sable/50 flex items-center justify-center text-sombre/40">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-sombre/70">Aucune notification pour le moment</p>
                <p className="text-[11px] text-sombre/50">
                  Vos commandes, alertes et paiements apparaîtront ici en temps réel.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const dateLabel = formatDateLabel(item.date);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                      item.read
                        ? 'bg-white hover:bg-[#FAFAF8]'
                        : 'bg-amber-50/25 hover:bg-amber-50/50'
                    }`}
                  >
                    {/* Icon Bubble */}
                    <div className={`p-2 rounded-xl border shrink-0 ${getItemBadgeBg(item.type, item.read)}`}>
                      {getItemIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5 pr-2">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            item.read ? 'text-sombre/80 font-semibold' : 'text-sombre font-extrabold'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-sombre/70 font-medium leading-snug line-clamp-2">
                        {item.message}
                      </p>
                      {dateLabel && (
                        <span className="text-[10px] font-semibold text-sombre/40 block pt-0.5">
                          {dateLabel}
                        </span>
                      )}
                    </div>

                    {/* Action buttons (Delete / Mark as Read) on hover */}
                    <div className="flex items-center gap-1 self-center shrink-0">
                      {!item.read && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                          }}
                          className="p-1 text-sombre/30 hover:text-accent rounded-full hover:bg-sable/30 transition-colors"
                          title="Marquer comme lu"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        className="p-1 text-sombre/30 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {item.link && (
                        <ChevronRight className="w-4 h-4 text-sombre/30 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="p-3 bg-[#FAF9F6] border-t border-sable/50 flex items-center justify-between text-xs">
              <button
                onClick={clearAll}
                className="text-[11px] text-sombre/50 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer tout</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/parametres');
                }}
                className="text-[11px] text-accent hover:underline font-bold"
              >
                Gérer les alertes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
