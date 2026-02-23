"use client";

/**
 * Kid Login Page — Child-friendly login with username + 4-digit PIN.
 *
 * Dark space theme matching the session pages.
 * PIN uses 4 separate digit boxes with auto-advance.
 */

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Persona emoji map (inline to avoid importing heavy AvatarDisplay)
const COSMO_EMOJI = "🐻";

export default function KidLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, "").slice(-1);

      setPin((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });

      // Auto-advance to next box
      if (digit && index < 3) {
        pinRefs[index + 1]?.current?.focus();
      }
    },
    [pinRefs]
  );

  const handlePinKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !pin[index] && index > 0) {
        pinRefs[index - 1]?.current?.focus();
      }
    },
    [pin, pinRefs]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pinStr = pin.join("");
    if (!username.trim()) {
      setError("Enter your username!");
      return;
    }
    if (pinStr.length < 4) {
      setError("Enter your full 4-digit PIN!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/child-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), pin: pinStr }),
      });

      if (res.ok) {
        router.push("/kid");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Try again!");
        // Clear PIN on error
        setPin(["", "", "", ""]);
        pinRefs[0]?.current?.focus();
      }
    } catch {
      setError("Oops! Can't connect right now. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D1B2A] flex flex-col items-center justify-center px-4">
      {/* Stars background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-1 h-1 bg-white/40 rounded-full animate-pulse" />
        <div className="absolute top-[20%] right-[25%] w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse delay-700" />
        <div className="absolute top-[40%] left-[60%] w-1 h-1 bg-white/50 rounded-full animate-pulse delay-300" />
        <div className="absolute top-[70%] left-[30%] w-1 h-1 bg-white/20 rounded-full animate-pulse delay-1000" />
        <div className="absolute top-[15%] right-[10%] w-1 h-1 bg-white/35 rounded-full animate-pulse delay-500" />
        <div className="absolute bottom-[20%] right-[40%] w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-200" />
        <div className="absolute bottom-[35%] left-[20%] w-1 h-1 bg-white/45 rounded-full animate-pulse delay-800" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Avatar */}
        <div className="text-center">
          <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-aauti-primary/30 to-aauti-secondary/30 flex items-center justify-center border-2 border-white/10 shadow-lg shadow-aauti-primary/20">
            <span className="text-6xl select-none">{COSMO_EMOJI}</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">
            Welcome back, explorer! 🚀
          </h1>
          <p className="mt-1 text-gray-400 text-sm">
            Enter your username and secret PIN
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ⭐ Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. arjun_star"
              autoComplete="username"
              autoFocus
              className="w-full px-4 py-3 bg-[#1A2744] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-aauti-primary focus:border-aauti-primary outline-none transition-all text-lg"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🔒 Secret PIN
            </label>
            <div className="flex gap-3 justify-center">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="w-14 h-16 text-center text-2xl font-bold bg-[#1A2744] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-aauti-primary focus:border-aauti-primary outline-none transition-all"
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-center py-2 px-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-lg font-bold text-white rounded-xl bg-gradient-to-r from-aauti-primary to-aauti-secondary hover:from-aauti-primary/90 hover:to-aauti-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-aauti-primary/25"
          >
            {loading ? (
              <span className="animate-pulse">Launching... 🚀</span>
            ) : (
              "Blast Off! 🚀"
            )}
          </button>
        </form>

        {/* Parent link */}
        <div className="text-center">
          <Link
            href="/api/auth/login"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            I&apos;m a parent →
          </Link>
        </div>
      </div>
    </main>
  );
}
