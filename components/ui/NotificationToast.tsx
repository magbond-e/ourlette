'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Bell,
  AlertTriangle,
  Clock,
  PartyPopper,
  Sparkles,
  Scissors,
  DollarSign,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { NotificationItem, NotificationType } from '@/lib/types/notification';

interface NotificationToastProps {
  notification: NotificationItem | null;
  onClose: () => void;
  onRead?: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onRead,
}) => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const handleClick = () => {
    if (onRead) onRead(notification.id);
    setVisible(false);
    setTimeout(onClose, 200);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'order_overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'order_due_soon':
        return <Clock className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'welcome':
        return <PartyPopper className="w-5 h-5 text-accent shrink-0" />;
      case 'payment_received':
        return <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'client_created':
        return <UserPlus className="w-5 h-5 text-sombre shrink-0" />;
      case 'order_created':
      case 'order_status':
        return <Scissors className="w-5 h-5 text-accent shrink-0" />;
      case 'feature_update':
        return <Sparkles className="w-5 h-5 text-gold shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-accent shrink-0" />;
    }
  };

  const getBadgeStyle = (type: NotificationType) => {
    switch (type) {
      case 'order_overdue':
        return 'bg-red-50 border-red-200';
      case 'order_due_soon':
        return 'bg-amber-50 border-amber-200';
      case 'payment_received':
        return 'bg-emerald-50 border-emerald-200';
      case 'welcome':
        return 'bg-accent/10 border-accent/20';
      default:
        return 'bg-[#F7F7F5] border-sable/60';
    }
  };

  return (
    <div
      className={`fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full transition-all duration-300 transform ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border-2 border-sable/80 shadow-2xl rounded-3xl p-4 overflow-hidden relative cursor-pointer hover:border-accent/40 transition-all font-sans group">
        <div className="flex items-start gap-3" onClick={handleClick}>
          {/* Icon Bubble */}
          <div className={`p-2.5 rounded-2xl border shrink-0 ${getBadgeStyle(notification.type)} shadow-xs`}>
            {getIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent">Notification</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold text-sombre truncate mt-0.5">
              {notification.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-sombre/70 font-medium line-clamp-2 mt-0.5">
              {notification.message}
            </p>
          </div>

          {notification.link && (
            <ChevronRight className="w-4 h-4 text-sombre/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all self-center shrink-0" />
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
            setTimeout(onClose, 200);
          }}
          className="absolute top-3 right-3 p-1 text-sombre/40 hover:text-sombre rounded-full hover:bg-sable/30 transition-colors"
          title="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Subtle timer bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sable/30">
          <div className="h-full bg-accent animate-[shrink_5s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
};
