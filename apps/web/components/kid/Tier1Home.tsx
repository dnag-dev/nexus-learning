"use client";

/**
 * Tier1Home — K through Grade 3
 *
 * Full screen, centered. Large Cosmo with bounce, friendly greeting,
 * one giant "Let's Go!" button. Nothing else — no stats, no badges.
 */

import { useChild } from "@/lib/child-context";
import Link from "next/link";
import { getPersonaById } from "@/lib/personas/persona-config";

export default function Tier1Home() {
  const { displayName, avatarPersonaId, studentId } = useChild();
  const persona = getPersonaById(avatarPersonaId);
  const emoji = persona?.avatarPlaceholder || "🤖";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      {/* Large Cosmo */}
      <div className="text-[140px] sm:text-[200px] mb-4 animate-bounce-subtle select-none">
        {emoji}
      </div>

      {/* Greeting */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
        Hey {displayName}! 👋
      </h1>
      <p className="text-lg text-gray-400 mb-8">
        Ready for some fun learning today?
      </p>

      {/* Giant Start Button */}
      <Link
        href={`/session?studentId=${studentId}`}
        className="w-full max-w-sm py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-200 shadow-lg text-center block"
      >
        Let&apos;s Go! 🚀
      </Link>

      {/* Tiny parent link */}
      <Link
        href="/dashboard"
        className="mt-8 text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        Parent view →
      </Link>
    </div>
  );
}
