"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import type { PersonaId } from "@/lib/personas/persona-config";

/**
 * AvatarDisplay — Shows the persona's avatar with HeyGen LiveAvatar streaming
 *
 * - Connects to HeyGen LiveAvatar SDK (@heygen/liveavatar-web-sdk) when available
 * - Falls back to large emoji + CSS animation when not
 * - Speaking animation: subtle bounce/pulse when speaking=true
 * - Emotional states drive visual: happy/neutral/thinking/encouraging
 * - Exposes speak() and stopSpeaking() via ref for parent to control
 *
 * LiveAvatar SDK Flow:
 *  1. Fetch session_token from /api/heygen/token (server creates via LiveAvatar API)
 *  2. new LiveAvatarSession(session_token) → create session instance
 *  3. session.start() → connects LiveKit room + WebSocket
 *  4. session.attach(videoElement) → renders avatar video/audio
 *  5. session.repeat(text) → makes avatar speak the given text
 *  6. session.interrupt() → stops current speech
 *  7. session.stop() → closes session
 */

export type AvatarEmotionalState =
  | "happy"
  | "neutral"
  | "thinking"
  | "encouraging";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarDisplayHandle {
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  isStreamReady: () => boolean;
  /** Update the avatar's emotional expression (used by emotional intelligence layer) */
  setEmotionalState: (state: AvatarEmotionalState) => void;
}

interface AvatarDisplayProps {
  personaId: PersonaId;
  speaking?: boolean;
  emotionalState?: AvatarEmotionalState;
  size?: AvatarSize;
  className?: string;
  /** Enable HeyGen live avatar stream (requires fetching token first) */
  enableLiveAvatar?: boolean;
  /** Callback when the avatar stream is ready */
  onStreamReady?: () => void;
  /** Callback when avatar starts/stops talking */
  onTalkingChange?: (isTalking: boolean) => void;
  /** Show a transition effect when emotional state changes */
  showEmotionalTransition?: boolean;
}

// Persona emoji map — covers all 14 personas
const PERSONA_EMOJI: Record<PersonaId, string> = {
  cosmo: "\u{1F916}",
  luna: "\u{1F319}",
  rex: "\u{1F995}",
  nova: "\u{2B50}",
  pip: "\u{1F9D1}\u{200D}\u{1F52C}",
  atlas: "\u{1F30D}",
  zara: "\u{1F3A4}",
  finn: "\u{1F3C4}",
  echo: "\u{231B}",
  sage: "\u{1F9D9}",
  bolt: "\u{1F4BB}",
  ivy: "\u{1F33F}",
  max: "\u{1F3C6}",
  aria: "\u{1F3B5}",
};

const SIZE_CLASSES: Record<AvatarSize, { container: string; emoji: string; video: string }> = {
  sm: { container: "w-12 h-12", emoji: "text-2xl", video: "w-12 h-12" },
  md: { container: "w-20 h-20", emoji: "text-4xl", video: "w-20 h-20" },
  lg: { container: "w-28 h-28", emoji: "text-6xl", video: "w-28 h-28" },
  xl: { container: "w-36 h-36", emoji: "text-7xl", video: "w-[280px] h-[280px]" },
};

const EMOTIONAL_GLOW: Record<AvatarEmotionalState, string> = {
  happy: "ring-4 ring-aauti-success/30 bg-aauti-success/5 animate-glow-pulse",
  neutral: "ring-2 ring-gray-200 bg-gray-50 animate-glow-pulse",
  thinking: "ring-4 ring-aauti-accent/30 bg-aauti-accent/5 animate-glow-pulse",
  encouraging: "ring-4 ring-aauti-primary/30 bg-aauti-primary/5 animate-glow-pulse",
};

const AvatarDisplay = forwardRef<AvatarDisplayHandle, AvatarDisplayProps>(
  function AvatarDisplay(
    {
      personaId,
      speaking = false,
      emotionalState = "neutral",
      size = "lg",
      className = "",
      enableLiveAvatar = false,
      onStreamReady,
      onTalkingChange,
      showEmotionalTransition = false,
    },
    ref
  ) {
    const [streamReady, setStreamReady] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [avatarTalking, setAvatarTalking] = useState(false);
    const [initFailed, setInitFailed] = useState(false);
    const [overrideEmotion, setOverrideEmotion] = useState<AvatarEmotionalState | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevEmotionRef = useRef<AvatarEmotionalState>(emotionalState);
    const videoRef = useRef<HTMLVideoElement>(null);
    const sessionRef = useRef<any>(null);

    // ─── Emotional Transition Effect ───
    useEffect(() => {
      if (showEmotionalTransition && emotionalState !== prevEmotionRef.current) {
        setIsTransitioning(true);
        const timer = setTimeout(() => setIsTransitioning(false), 600);
        prevEmotionRef.current = emotionalState;
        return () => clearTimeout(timer);
      }
      prevEmotionRef.current = emotionalState;
    }, [emotionalState, showEmotionalTransition]);

    // ─── Initialize HeyGen LiveAvatar Session ───

    const initializeAvatar = useCallback(async () => {
      if (!enableLiveAvatar || isConnecting || streamReady || initFailed) return;

      setIsConnecting(true);

      try {
        // Step 1: Get session token from our server
        const tokenRes = await fetch("/api/heygen/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId }),
        });
        if (!tokenRes.ok) {
          console.warn("Failed to get LiveAvatar token — falling back to emoji avatar");
          setIsConnecting(false);
          setInitFailed(true);
          return;
        }
        const { sessionToken } = await tokenRes.json();
        if (!sessionToken) {
          console.warn("No sessionToken in response — falling back to emoji avatar");
          setIsConnecting(false);
          setInitFailed(true);
          return;
        }

        // Step 2: Import LiveAvatar SDK dynamically (client-only module)
        const {
          LiveAvatarSession,
          SessionEvent,
          AgentEventsEnum,
        } = await import("@heygen/liveavatar-web-sdk");

        // Step 3: Create the LiveAvatar session instance
        const session = new LiveAvatarSession(sessionToken);
        sessionRef.current = session;

        // Step 4: Listen for session events
        session.on(SessionEvent.SESSION_STREAM_READY, () => {
          // Attach the video/audio stream to our video element
          if (videoRef.current) {
            session.attach(videoRef.current);
          }
          setStreamReady(true);
          setIsConnecting(false);
          onStreamReady?.();
        });

        session.on(SessionEvent.SESSION_DISCONNECTED, () => {
          setStreamReady(false);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        });

        // Listen for avatar speaking events
        session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
          setAvatarTalking(true);
          onTalkingChange?.(true);
        });

        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
          setAvatarTalking(false);
          onTalkingChange?.(false);
        });

        // Step 5: Start the session (connects to LiveKit + WebSocket)
        await session.start();
      } catch (err) {
        console.warn(
          "LiveAvatar init failed — falling back to emoji avatar:",
          err instanceof Error ? err.message : err
        );
        setIsConnecting(false);
        setInitFailed(true);
      }
    }, [enableLiveAvatar, isConnecting, streamReady, initFailed, personaId, onStreamReady, onTalkingChange]);

    // ─── Cleanup on unmount ───

    useEffect(() => {
      return () => {
        if (sessionRef.current) {
          sessionRef.current.stop().catch(() => {});
          sessionRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    }, []);

    // ─── Auto-initialize when enableLiveAvatar is true ───

    useEffect(() => {
      if (enableLiveAvatar && !streamReady && !isConnecting && !initFailed) {
        initializeAvatar();
      }
    }, [enableLiveAvatar, streamReady, isConnecting, initFailed, initializeAvatar]);

    // ─── Imperative Handle for parent control ───

    useImperativeHandle(ref, () => ({
      speak: async (text: string) => {
        if (!sessionRef.current || !streamReady) return;
        try {
          // Use repeat() to speak text directly (works in both FULL and LITE modes)
          await sessionRef.current.repeat(text);
        } catch (err) {
          console.warn("Avatar speak failed:", err);
        }
      },
      stopSpeaking: async () => {
        if (!sessionRef.current) return;
        try {
          await sessionRef.current.interrupt();
        } catch (err) {
          console.warn("Avatar interrupt failed:", err);
        }
      },
      isStreamReady: () => streamReady,
      setEmotionalState: (state: AvatarEmotionalState) => {
        setOverrideEmotion(state);
        // Clear override after 5 seconds so it doesn't stick forever
        setTimeout(() => setOverrideEmotion(null), 5000);
      },
    }));

    // ─── Render ───

    const emoji = PERSONA_EMOJI[personaId] ?? "\u{2B50}";
    const sizeClass = SIZE_CLASSES[size];
    const effectiveEmotion = overrideEmotion ?? emotionalState;
    const glowClass = EMOTIONAL_GLOW[effectiveEmotion];
    const isSpeaking = speaking || avatarTalking;
    const transitionClass = isTransitioning ? "scale-110" : "scale-100";

    // Animation classes for emoji fallback
    const speakingAnimation = isSpeaking
      ? "animate-avatar-speak"
      : "";
    const emotionalAnimation =
      effectiveEmotion === "happy"
        ? "animate-avatar-happy"
        : effectiveEmotion === "thinking"
          ? "animate-avatar-think"
          : "";

    // HeyGen live avatar stream
    if (streamReady || isConnecting) {
      return (
        <div className={`relative ${className}`}>
          <div
            className={`${sizeClass.video} rounded-2xl overflow-hidden ${glowClass} transition-all duration-300 ${
              isSpeaking ? "ring-4 ring-aauti-primary/50" : ""
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {isConnecting && !streamReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Emoji fallback with animations
    return (
      <div
        className={`${sizeClass.container} rounded-full flex items-center justify-center ${glowClass} ${speakingAnimation} ${emotionalAnimation} ${transitionClass} transition-all duration-300 ${className}`}
        role="img"
        aria-label={`${personaId} avatar — ${effectiveEmotion}`}
      >
        <span className={`${sizeClass.emoji} select-none`}>{emoji}</span>
      </div>
    );
  }
);

export default AvatarDisplay;

// Export emoji map for use elsewhere
export { PERSONA_EMOJI };
