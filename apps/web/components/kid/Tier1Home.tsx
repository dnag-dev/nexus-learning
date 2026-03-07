"use client";

/**
 * Tier1Home — K through Grade 3
 *
 * Full screen, centered. Large Cosmo with bounce, friendly greeting,
 * one giant "Let's Go!" button + subject tabs + topic search.
 *
 * ⚠️  CRITICAL FEATURES (DO NOT REMOVE):
 * 1. SubjectTabs — subject switching (Math ↔ English)
 * 2. TopicSearchInput — prompt-based learning
 * These were restored after being accidentally removed in the Phase 5 UX overhaul.
 */

import { useState } from "react";
import { useChild } from "@/lib/child-context";
import Link from "next/link";
import { getPersonaById } from "@/lib/personas/persona-config";
import TopicSearchInput from "@/components/kid/TopicSearchInput";
import SubjectTabs, { type Subject } from "@/components/kid/SubjectTabs";

export default function Tier1Home() {
  const { displayName, avatarPersonaId, studentId } = useChild();
  const persona = getPersonaById(avatarPersonaId);
  const emoji = persona?.avatarPlaceholder || "🤖";
  const [subject, setSubject] = useState<Subject>("MATH");

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
      <p className="text-lg text-gray-400 mb-4">
        Ready for some fun learning today?
      </p>

      {/* ⚠️ Subject switching — Math / English */}
      <div className="mb-6">
        <SubjectTabs
          subject={subject}
          onSubjectChange={setSubject}
          variant="young"
        />
      </div>

      {/* Giant Start Button — auto-picks next concept for selected subject */}
      <Link
        href={`/session?studentId=${studentId}&subject=${subject}&returnTo=/kid`}
        className="w-full max-w-sm py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-200 shadow-lg text-center block"
      >
        Let&apos;s Go! 🚀
      </Link>

      {/* ⚠️ Prompt-based learning — topic search chips + text input */}
      <div className="mt-6 w-full max-w-sm">
        <TopicSearchInput
          studentId={studentId}
          subject={subject}
          variant="young"
        />
      </div>

      {/* Phase 13: Fluency Zone button */}
      <Link
        href={`/kid/fluency-zone?studentId=${studentId}`}
        className="mt-6 w-full max-w-sm py-3 bg-[#141d30] border border-white/10 text-white text-lg font-medium rounded-xl hover:border-cyan-500/30 transition-colors text-center block"
      >
        ⚡ Speed Practice!
      </Link>

      {/* Tiny parent link */}
      <Link
        href="/dashboard"
        className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        Parent view →
      </Link>
    </div>
  );
}
