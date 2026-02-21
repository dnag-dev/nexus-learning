"use client";

/**
 * Parent Layout — Phase 9: Parent Dashboard
 *
 * Shared layout with sidebar navigation for all parent routes.
 * Syncs Auth0 session → DB user, provides parent context.
 */

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter, usePathname } from "next/navigation";
import ParentSidebar, {
  type ChildSummary,
} from "@/components/parent/ParentSidebar";
import NotificationCenter, {
  type ParentNotification,
} from "@/components/parent/NotificationCenter";
import { ParentContext } from "@/lib/parent-context";

interface ParentProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
}

interface ParentData {
  name: string;
  plan: string;
  children: ChildSummary[];
}

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract child ID from URL
  const childIdMatch = pathname.match(/\/child\/([^/]+)/);
  const selectedChildId = childIdMatch ? childIdMatch[1] : undefined;

  // Step 1: Sync Auth0 user → DB user
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

    fetch("/api/auth/sync")
      .then((res) => {
        if (!res.ok) throw new Error("Sync failed");
        return res.json();
      })
      .then((data) => {
        setProfile({
          id: data.id,
          email: data.email,
          name: data.name,
          plan: data.plan,
        });
      })
      .catch((err) => {
        console.error("Auth sync failed:", err);
      });
  }, [user, authLoading, router]);

  // Step 2: Fetch parent data once we have the DB user ID
  const fetchData = useCallback(async () => {
    if (!profile) return;

    try {
      const [parentRes, notifRes] = await Promise.all([
        fetch(`/api/parent/${profile.id}/overview`),
        fetch(`/api/parent/${profile.id}/notifications`),
      ]);

      if (parentRes.ok) {
        const data = await parentRes.json();
        setParentData({
          name: data.parentName,
          plan: data.subscriptionPlan,
          children: data.children,
        });
      }

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load parent data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  const handleMarkAllRead = async () => {
    if (!profile) return;
    try {
      await fetch(`/api/parent/${profile.id}/notifications/mark-all-read`, {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleMarkRead = async (notifId: string) => {
    if (!profile) return;
    try {
      await fetch(`/api/parent/${profile.id}/notifications/${notifId}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  // Loading states
  if (authLoading || (!profile && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">
          Signing you in...
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to login
  }

  if (loading && !parentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <ParentContext.Provider
      value={{
        parentId: profile?.id ?? "",
        email: profile?.email ?? "",
        name: profile?.name ?? "",
        plan: parentData?.plan ?? profile?.plan ?? "SPARK",
      }}
    >
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <ParentSidebar
          parentName={profile?.name || "Parent"}
          subscriptionPlan={parentData?.plan || profile?.plan || "SPARK"}
          children={parentData?.children || []}
          selectedChildId={selectedChildId}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div className="lg:hidden w-10" />
            <h1 className="text-lg font-semibold text-gray-900 hidden lg:block">
              Parent Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <NotificationCenter
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
              />
              <span className="text-sm text-gray-500 hidden md:block">
                {profile?.name}
              </span>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6 max-w-6xl mx-auto">{children}</main>
        </div>
      </div>
    </ParentContext.Provider>
  );
}
