"use client";

/**
 * Parent Layout — Phase 9: Parent Dashboard
 *
 * Shared layout with sidebar navigation for all parent routes.
 * Syncs Auth0 session → DB user, provides parent context.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter, usePathname } from "next/navigation";
import ParentSidebar, {
  type ChildSummary,
} from "@/components/parent/ParentSidebar";
import NotificationCenter, {
  type ParentNotification,
} from "@/components/parent/NotificationCenter";
import { ParentContext } from "@/lib/parent-context";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";

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
  const breakpoint = useBreakpoint();

  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

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

    setSyncError(null);
    fetch("/api/auth/sync")
      .then((res) => {
        if (!res.ok) throw new Error(`Sync failed (HTTP ${res.status})`);
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
        setSyncError(
          err.message || "Failed to sync your account. Please try again."
        );
        setLoading(false);
      });
  }, [user, authLoading, router]);

  // Step 2: Fetch parent data once we have the DB user ID
  const fetchData = useCallback(async () => {
    if (!profile?.id) return;

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
        setNotifications(data.notifications ?? []);
      }
    } catch (err) {
      console.error("Failed to load parent data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) fetchData();
  }, [profile?.id, fetchData]);

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

  // Memoize context value to avoid unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      parentId: profile?.id ?? "",
      email: profile?.email ?? "",
      name: profile?.name ?? "",
      plan: parentData?.plan ?? profile?.plan ?? "SPARK",
    }),
    [profile?.id, profile?.email, profile?.name, profile?.plan, parentData?.plan]
  );

  // Loading states
  if (authLoading) {
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

  // Sync error — show retry UI instead of stuck loading
  if (syncError && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 mb-4">{syncError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
            <a
              href="/api/auth/logout"
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for profile sync
  if (!profile && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">
          Signing you in...
        </div>
      </div>
    );
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

  // Tablet mode: sidebar renders as horizontal nav bar → need column flex
  const isTablet = breakpoint === "tablet";

  return (
    <ParentContext.Provider value={contextValue}>
      <div className={`min-h-screen bg-gray-50 flex ${isTablet ? "flex-col" : ""}`}>
        {/* Sidebar — desktop: left column, tablet: horizontal bar, mobile: hamburger overlay */}
        <ParentSidebar
          parentName={profile?.name || "Parent"}
          parentEmail={profile?.email}
          subscriptionPlan={parentData?.plan || profile?.plan || "SPARK"}
          children={parentData?.children || []}
          selectedChildId={selectedChildId}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div className="lg:hidden w-10" />
            <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">
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
              <a
                href="/api/auth/logout"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors hidden md:block"
                title="Sign out"
              >
                Sign Out
              </a>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-5 max-w-[1100px] mx-auto">{children}</main>
        </div>
      </div>
    </ParentContext.Provider>
  );
}
