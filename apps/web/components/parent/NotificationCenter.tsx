"use client";

/**
 * NotificationCenter — Phase 9: Parent Dashboard
 *
 * Bell icon in header with unread count badge.
 * Dropdown panel showing notifications grouped by type.
 * Links each notification to the relevant dashboard section.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Types ───

export interface ParentNotification {
  id: string;
  type: string; // REVIEW_DUE | BADGE_EARNED | LEVEL_UP | REPORT_READY | STREAK_REMINDER
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO
  childId: string;
  childName: string;
}

interface NotificationCenterProps {
  notifications: ParentNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

// ─── Type Config ───

const TYPE_CONFIG: Record<string, { icon: string; color: string; link: (childId: string) => string }> = {
  REVIEW_DUE: {
    icon: "📚",
    color: "bg-orange-50 border-orange-200",
    link: (id) => `/child/${id}/progress`,
  },
  BADGE_EARNED: {
    icon: "🏅",
    color: "bg-purple-50 border-purple-200",
    link: (id) => `/child/${id}/progress`,
  },
  LEVEL_UP: {
    icon: "⭐",
    color: "bg-blue-50 border-blue-200",
    link: (id) => `/child/${id}/progress`,
  },
  REPORT_READY: {
    icon: "📝",
    color: "bg-green-50 border-green-200",
    link: (id) => `/child/${id}/reports`,
  },
  STREAK_REMINDER: {
    icon: "🔥",
    color: "bg-amber-50 border-amber-200",
    link: (id) => `/child/${id}/progress`,
  },
};

// ─── Component ───

export default function NotificationCenter({
  notifications,
  onMarkAllRead,
  onMarkRead,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h4 className="font-semibold text-gray-900 text-sm">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  onMarkAllRead();
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 20).map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.BADGE_EARNED;
                return (
                  <Link
                    key={notification.id}
                    href={config.link(notification.childId)}
                    onClick={() => {
                      if (!notification.read) {
                        onMarkRead(notification.id);
                      }
                      setOpen(false);
                    }}
                    className={`block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      !notification.read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}`}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {notification.childName}
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {formatNotifTime(new Date(notification.createdAt))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───

function formatNotifTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export { TYPE_CONFIG, formatNotifTime };
