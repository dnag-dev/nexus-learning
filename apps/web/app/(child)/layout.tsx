"use client";

/**
 * Child Layout — Authenticated layout for child routes (/kid/*).
 *
 * Verifies the child JWT cookie, provides ChildContext,
 * and renders a child-friendly dark top bar.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChildContext } from "@/lib/child-context";

interface ChildProfile {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  xp: number;
  level: number;
  gradeLevel: string;
  ageGroup: string;
  firstLoginComplete: boolean;
}

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🌙",
  rex: "🦖",
  nova: "⭐",
  pip: "🐧",
  zara: "🦋",
  finn: "🐬",
  ruby: "💎",
  echo: "⏳",
  sage: "🧙",
  bolt: "💻",
  ivy: "🌿",
  max: "🏆",
  aria: "🎵",
};

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/child-session")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
      })
      .catch(() => {
        router.push("/kid-login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  // Refresh profile from server — call after XP-changing actions to keep header in sync
  const refreshProfile = useCallback(() => {
    fetch("/api/auth/child-session")
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => { /* non-critical */ });
  }, []);

  // Auto-refresh XP/level when navigating back to kid pages (e.g. after completing a session)
  useEffect(() => {
    if (profile) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/child-logout", { method: "POST" });
    router.push("/kid-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-bounce">🚀</div>
          <p className="text-[#6B7280] animate-pulse">Loading your world...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Redirecting to login
  }

  const emoji = PERSONA_EMOJI[profile.avatarPersonaId] ?? "⭐";

  return (
    <ChildContext.Provider value={{ ...profile, refreshProfile }}>
      <div className="min-h-screen bg-[#F8F9FF]">
        {/* Top Bar */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-[#E2E8F0] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aauti-primary/20 to-aauti-secondary/20 flex items-center justify-center border border-[#E2E8F0]">
              <span className="text-xl select-none">{emoji}</span>
            </div>
            <div>
              <span className="text-[#1F2937] font-semibold text-sm">
                {profile.displayName}
              </span>
              <span className="block text-[#6B7280] text-xs">
                Level {profile.level}
              </span>
            </div>
          </div>

          {/* Right: XP + Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-[#FFC800]/10 rounded-full px-3 py-1.5">
              <span className="text-[#FF9600] text-xs font-medium">
                ⭐ {profile.xp.toLocaleString()} XP
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-sm"
              title="Sign out"
            >
              👋
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </ChildContext.Provider>
  );
}
