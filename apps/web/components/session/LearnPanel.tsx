"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WatchTab from "./learn-panel/WatchTab";
import ExamplesTab from "./learn-panel/ExamplesTab";
import AskTab from "./learn-panel/AskTab";
import type { LearnMoreContent } from "@/lib/prompts/types";

type TabId = "watch" | "examples" | "ask";

interface LearnPanelProps {
  sessionId: string;
  nodeTitle: string;
  personaId: string;
  isVisible: boolean;
  onEvent?: (type: string, detail?: string) => void;
}

export default function LearnPanel({
  sessionId,
  nodeTitle,
  personaId,
  isVisible,
  onEvent,
}: LearnPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("watch");
  const [content, setContent] = useState<LearnMoreContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimeRef = useRef<number>(0);

  // Fetch content on first open
  const fetchContent = useCallback(async () => {
    if (content || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/session/learn-more?sessionId=${encodeURIComponent(sessionId)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setContent(data.content);
    } catch (e) {
      console.error("[LearnPanel] Failed to fetch content:", e);
      setError("Couldn't load help content. Try again?");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, content, isLoading]);

  const openPanel = useCallback(() => {
    setIsOpen(true);
    openTimeRef.current = Date.now();
    onEvent?.("learn_panel_opened");
    fetchContent();
  }, [fetchContent, onEvent]);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    const duration = Date.now() - openTimeRef.current;
    onEvent?.("learn_panel_closed");
    onEvent?.("learn_panel_duration_ms", String(duration));
  }, [onEvent]);

  const switchTab = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      onEvent?.("learn_panel_tab_switched", tab);
    },
    [onEvent]
  );

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closePanel]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        closePanel();
      }
    };
    // Delay to avoid closing immediately when button is clicked
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handler);
    };
  }, [isOpen, closePanel]);

  // Reset content when sessionId changes (new concept)
  useEffect(() => {
    setContent(null);
    setError(null);
    setIsOpen(false);
    setActiveTab("watch");
  }, [sessionId]);

  if (!isVisible) return null;

  const TABS: { id: TabId; icon: string; label: string }[] = [
    { id: "watch", icon: "🎬", label: "Watch" },
    { id: "examples", icon: "📝", label: "Examples" },
    { id: "ask", icon: "💬", label: "Ask" },
  ];

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={openPanel}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-aauti-primary text-white rounded-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-200"
            aria-label="Open Learn More panel"
          >
            <span className="text-lg">📚</span>
            <span className="text-sm font-medium">Learn More</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop (mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:bg-black/30"
          />
        )}
      </AnimatePresence>

      {/* Panel drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] md:w-[400px] bg-[#0D1B2A] border-l border-white/10 shadow-2xl flex flex-col"
            role="dialog"
            aria-label="Learn More panel"
          >
            {/* ─── Header ─── */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
              <span className="text-xl">📚</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white truncate">
                  Learn More
                </h2>
                <p className="text-xs text-gray-400 truncate">{nodeTitle}</p>
              </div>
              <button
                onClick={closePanel}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>

            {/* ─── Tabs ─── */}
            <div className="flex border-b border-white/10 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-aauti-primary border-b-2 border-aauti-primary"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ─── Content ─── */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex gap-2 mb-4">
                    <div
                      className="w-3 h-3 rounded-full bg-aauti-primary animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-3 h-3 rounded-full bg-aauti-primary animate-bounce"
                      style={{ animationDelay: "100ms" }}
                    />
                    <div
                      className="w-3 h-3 rounded-full bg-aauti-primary animate-bounce"
                      style={{ animationDelay: "200ms" }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    Preparing your study guide...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3">😕</p>
                  <p className="text-sm text-gray-400 mb-4">{error}</p>
                  <button
                    onClick={() => {
                      setContent(null);
                      setError(null);
                      fetchContent();
                    }}
                    className="px-4 py-2 bg-aauti-primary/20 text-aauti-primary text-sm rounded-lg hover:bg-aauti-primary/30 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : content ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    {activeTab === "watch" && (
                      <WatchTab
                        definition={content.definition}
                        steps={content.steps}
                        personaId={personaId}
                        onEvent={onEvent}
                      />
                    )}
                    {activeTab === "examples" && (
                      <ExamplesTab
                        examples={content.examples}
                        onEvent={onEvent}
                        onClose={closePanel}
                      />
                    )}
                    {activeTab === "ask" && (
                      <AskTab
                        faqs={content.faqs}
                        sessionId={sessionId}
                        onEvent={onEvent}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
