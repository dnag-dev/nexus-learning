"use client";

/**
 * TopicSearchInput — Reusable topic search for kid dashboards.
 *
 * ⚠️  CRITICAL FEATURE: Prompt-based learning.
 * This component allows students to type a topic (e.g., "fractions", "grammar")
 * and start a session on that topic. The session start API's `findConceptByTopic()`
 * function handles the fuzzy matching.
 *
 * DO NOT REMOVE — This was accidentally removed in the Phase 5 UX overhaul (commit 50dd928)
 * and restored in this commit. Always ensure dashboards include topic search.
 *
 * Three visual variants via `variant` prop:
 * - "young" (Tier 1, K-G3): Large, colorful, emoji-heavy
 * - "mid" (Tier 2, G4-G7): Compact, gamified feel
 * - "teen" (Tier 3, G8-G12): Clean, minimal
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type SearchVariant = "young" | "mid" | "teen";

interface TopicSearchInputProps {
  studentId: string;
  subject?: "MATH" | "ENGLISH";
  variant?: SearchVariant;
  /** Optional callback instead of default navigation */
  onStartTopic?: (topic: string) => void;
}

const PLACEHOLDER_TEXT: Record<SearchVariant, string> = {
  young: "What do you want to learn? 🔍",
  mid: "Search a topic... (e.g., fractions, grammar)",
  teen: "Search for a specific topic...",
};

const SUGGESTION_CHIPS: Record<string, string[]> = {
  MATH: ["Fractions", "Multiplication", "Geometry", "Algebra", "Decimals"],
  ENGLISH: ["Grammar", "Vocabulary", "Reading", "Spelling", "Writing"],
};

export default function TopicSearchInput({
  studentId,
  subject = "MATH",
  variant = "mid",
  onStartTopic,
}: TopicSearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear error when user types
  useEffect(() => {
    if (query.length > 0) setSearchError(null);
  }, [query]);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchError("Type at least 2 characters");
      return;
    }

    if (onStartTopic) {
      onStartTopic(trimmed);
      return;
    }

    // Navigate to session with topic parameter
    setIsSearching(true);
    setSearchError(null);

    const params = new URLSearchParams({
      studentId,
      topic: trimmed,
      subject,
      returnTo: "/kid",
    });

    router.push(`/session?${params.toString()}`);
  }, [query, studentId, subject, router, onStartTopic]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch();
    }
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    // Navigate immediately
    const params = new URLSearchParams({
      studentId,
      topic: chip,
      subject,
      returnTo: "/kid",
    });
    router.push(`/session?${params.toString()}`);
  };

  const chips = SUGGESTION_CHIPS[subject] ?? SUGGESTION_CHIPS.MATH;

  // ─── Young Variant (K-G3): Big, colorful ───
  if (variant === "young") {
    return (
      <div className="w-full max-w-sm mx-auto space-y-3">
        <p className="text-center text-gray-400 text-sm">
          Or pick something to learn:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {chips.slice(0, 4).map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className="px-4 py-2.5 bg-white/10 hover:bg-purple-500/30 text-white rounded-full text-sm font-medium transition-all hover:scale-105"
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={PLACEHOLDER_TEXT.young}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none transition-all ${
              isFocused
                ? "border-purple-500/50 bg-white/8"
                : "border-white/10"
            } ${searchError ? "border-red-500/50" : ""}`}
          />
          {query.length >= 2 && (
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isSearching ? "..." : "Go! 🚀"}
            </button>
          )}
        </div>
        {searchError && (
          <p className="text-center text-red-400 text-xs">{searchError}</p>
        )}
      </div>
    );
  }

  // ─── Teen Variant (G8-G12): Minimal ───
  if (variant === "teen") {
    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={PLACEHOLDER_TEXT.teen}
            className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none transition-all ${
              isFocused
                ? "border-purple-500/40 bg-white/8"
                : "border-white/10"
            } ${searchError ? "border-red-500/50" : ""}`}
          />
          {query.length >= 2 && (
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isSearching ? "..." : "Go →"}
            </button>
          )}
        </div>
        {/* Quick chips */}
        {isFocused && query.length === 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {chips.map((chip) => (
              <button
                key={chip}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  handleChipClick(chip);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded text-xs transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        {searchError && (
          <p className="text-red-400 text-xs">{searchError}</p>
        )}
      </div>
    );
  }

  // ─── Mid Variant (G4-G7): Default ───
  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={PLACEHOLDER_TEXT.mid}
          className={`w-full pl-9 pr-16 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none transition-all ${
            isFocused
              ? "border-purple-500/50 bg-white/8"
              : "border-white/10"
          } ${searchError ? "border-red-500/50" : ""}`}
        />
        {query.length >= 2 && (
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isSearching ? "..." : "Go →"}
          </button>
        )}
      </div>
      {/* Quick chips on focus */}
      {isFocused && query.length === 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {chips.map((chip) => (
            <button
              key={chip}
              onMouseDown={(e) => {
                e.preventDefault();
                handleChipClick(chip);
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
      {searchError && (
        <p className="text-red-400 text-xs mt-1">{searchError}</p>
      )}
    </div>
  );
}
