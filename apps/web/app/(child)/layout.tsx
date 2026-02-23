"use client";

/**
 * Child Layout — Authenticated layout for child routes (/kid/*).
 *
 * Verifies the child JWT cookie, provides ChildContext,
 * and renders a child-friendly dark top bar.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChildContext } from "@/lib/child-context";

interface ChildProfile {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  xp: number;
  level: number;
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

  const handleLogout = async () => {
    await fetch("/api/auth/child-logout", { method: "POST" });
    router.push("/kid-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-bounce">🚀</div>
          <p className="text-gray-400 animate-pulse">Loading your world...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Redirecting to login
  }

  const emoji = PERSONA_EMOJI[profile.avatarPersonaId] ?? "⭐";

  return (
    <ChildContext.Provider value={profile}>
      <div className="min-h-screen bg-[#0D1B2A]">
        {/* Top Bar */}
        <header className="bg-[#0F1B2D]/90 backdrop-blur-sm border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aauti-primary/30 to-aauti-secondary/30 flex items-center justify-center border border-white/10">
              <span className="text-xl select-none">{emoji}</span>
            </div>
            <div>
              <span className="text-white font-semibold text-sm">
                {profile.displayName}
              </span>
              <span className="block text-gray-500 text-xs">
                Level {profile.level}
              </span>
            </div>
          </div>

          {/* Right: XP + Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5">
              <span className="text-aauti-accent text-xs font-medium">
                ⭐ {profile.xp.toLocaleString()} XP
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
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
