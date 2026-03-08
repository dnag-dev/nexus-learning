"use client";

/**
 * FluencyZonePicker — Phase 13: Topic selection screen for Fluency Zone.
 *
 * Shows available topics grouped by subject, with personal bests.
 * Student picks a topic and time limit, then starts speed drill.
 */

import { useState, useEffect } from "react";

interface FluencyTopic {
  nodeId: string;
  nodeCode: string;
  title: string;
  subject: string;
  gradeLevel: string;
  domain: string;
  bktProbability: number;
  personalBestQPM: number | null;
}

interface FluencyZonePickerProps {
  studentId: string;
  onStart: (nodeId: string, timeLimitSeconds: number) => void;
  onBack: () => void;
  starting?: boolean;
  error?: string | null;
}

const TIME_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
];

export default function FluencyZonePicker({
  studentId,
  onStart,
  onBack,
  starting = false,
  error = null,
}: FluencyZonePickerProps) {
  const [topics, setTopics] = useState<FluencyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<"MATH" | "ENGLISH">("MATH");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState(120); // default 2 min
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/session/fluency-zone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "topics", studentId, subject }),
    })
      .then((r) => r.json())
      .then((data) => setTopics(data.topics ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, subject]);

  const filtered = search
    ? topics.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : topics;

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6">
      {/* Header */}
      <div className="max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white mb-4 text-sm"
        >
          ← Back
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">⚡ Fluency Zone</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Pick a topic to practice for speed
          </p>
        </div>

        {/* Subject Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setSubject("MATH"); setSelectedNode(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              subject === "MATH"
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-400"
            }`}
          >
            🔢 Math
          </button>
          <button
            onClick={() => { setSubject("ENGLISH"); setSelectedNode(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              subject === "ENGLISH"
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-400"
            }`}
          >
            📖 English
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 mb-4 focus:border-cyan-500 focus:outline-none"
        />

        {/* Topic List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-gray-500">Loading topics...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              {topics.length === 0
                ? "Practice some topics first to unlock Fluency Zone!"
                : "No topics match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-6">
            {filtered.map((topic) => (
              <button
                key={topic.nodeId}
                onClick={() => setSelectedNode(topic.nodeId)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  selectedNode === topic.nodeId
                    ? "bg-cyan-500/20 border border-cyan-500"
                    : "bg-white/5 border border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{topic.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {topic.gradeLevel} · {topic.domain}
                    </p>
                  </div>
                  {topic.personalBestQPM && (
                    <span className="text-xs text-yellow-400 font-medium">
                      ⚡ {topic.personalBestQPM.toFixed(1)} Q/min
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Time Selection */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
            Pick your time
          </p>
          <div className="flex gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                onClick={() => setSelectedTime(opt.seconds)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedTime === opt.seconds
                    ? "bg-cyan-600 text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/15"
                }`}
              >
                ⏱ {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={() => selectedNode && !starting && onStart(selectedNode, selectedTime)}
          disabled={!selectedNode || starting}
          className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
            starting
              ? "bg-gradient-to-r from-cyan-500/60 to-purple-600/60 text-white/80 cursor-wait"
              : selectedNode
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/25"
                : "bg-white/10 text-gray-600 cursor-not-allowed"
          }`}
        >
          {starting
            ? "Starting... ⏳"
            : selectedNode
              ? "Start! ⚡"
              : "Select a topic first"}
        </button>
      </div>
    </div>
  );
}
