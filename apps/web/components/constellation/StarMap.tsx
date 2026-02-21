"use client";

/**
 * Constellation Star Map — Phase 7: Gamification
 *
 * Interactive Canvas-based star map that visualizes a student's
 * knowledge graph mastery as a constellation of stars.
 *
 * Star States:
 *  - dim (gray): Unvisited concept
 *  - glowing (blue): Currently learning / exposed
 *  - bright (gold): Mastered concept
 *  - pulsing (rainbow): Recently mastered (celebration)
 *
 * Features:
 *  - Pan and zoom interaction
 *  - Tap/click for concept details
 *  - Animated star transitions
 *  - Prerequisite edge rendering (constellation lines)
 *  - Real-time updates on mastery changes
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ───

export type StarState = "dim" | "glowing" | "bright" | "pulsing";

export interface StarNode {
  id: string;
  name: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  state: StarState;
  level: number; // 0-5 mastery level
  subject: string;
  dueForReview?: boolean; // Phase 8: pulsing ring for due reviews
}

export interface StarEdge {
  from: string;
  to: string;
}

export interface ConstellationData {
  stars: StarNode[];
  edges: StarEdge[];
  name: string;
  subject: string;
}

interface StarMapProps {
  data: ConstellationData;
  width?: number;
  height?: number;
  onStarClick?: (star: StarNode) => void;
  selectedStarId?: string | null;
  showLabels?: boolean;
  animate?: boolean;
  className?: string;
}

// ─── Star Colors ───

const STAR_COLORS: Record<StarState, string> = {
  dim: "#6B7280", // gray-500
  glowing: "#3B82F6", // blue-500
  bright: "#F59E0B", // amber-500
  pulsing: "#8B5CF6", // violet-500
};

const STAR_GLOW_COLORS: Record<StarState, string> = {
  dim: "rgba(107, 114, 128, 0.2)",
  glowing: "rgba(59, 130, 246, 0.4)",
  bright: "rgba(245, 158, 11, 0.5)",
  pulsing: "rgba(139, 92, 246, 0.6)",
};

const EDGE_COLORS: Record<StarState, string> = {
  dim: "rgba(107, 114, 128, 0.15)",
  glowing: "rgba(59, 130, 246, 0.3)",
  bright: "rgba(245, 158, 11, 0.4)",
  pulsing: "rgba(139, 92, 246, 0.5)",
};

// ─── Component ───

export default function StarMap({
  data,
  width: propWidth,
  height: propHeight,
  onStarClick,
  selectedStarId,
  showLabels = true,
  animate = true,
  className = "",
}: StarMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: propWidth ?? 800, height: propHeight ?? 600 });

  // Pan & zoom state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Animation
  const timeRef = useRef(0);

  // ─── Resize handler ───
  useEffect(() => {
    if (propWidth && propHeight) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [propWidth, propHeight]);

  // ─── Canvas-to-star coordinates ───
  const canvasToWorld = useCallback(
    (canvasX: number, canvasY: number) => {
      const worldX = (canvasX - offset.x) / scale;
      const worldY = (canvasY - offset.y) / scale;
      return { x: worldX / dimensions.width, y: worldY / dimensions.height };
    },
    [offset, scale, dimensions]
  );

  const worldToCanvas = useCallback(
    (normX: number, normY: number) => {
      const padding = 60;
      const usableW = dimensions.width - padding * 2;
      const usableH = dimensions.height - padding * 2;
      return {
        x: (normX * usableW + padding) * scale + offset.x,
        y: (normY * usableH + padding) * scale + offset.y,
      };
    },
    [offset, scale, dimensions]
  );

  // ─── Hit detection ───
  const findStarAt = useCallback(
    (canvasX: number, canvasY: number): StarNode | null => {
      const hitRadius = 20;
      for (const star of data.stars) {
        const pos = worldToCanvas(star.x, star.y);
        const dx = canvasX - pos.x;
        const dy = canvasY - pos.y;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          return star;
        }
      }
      return null;
    },
    [data.stars, worldToCanvas]
  );

  // ─── Mouse/touch handlers ───
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      // Check if clicking a star
      const star = findStarAt(x, y);
      if (star && onStarClick) {
        onStarClick(star);
        isDragging.current = false;
      }
    },
    [findStarAt, onStarClick]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(3, Math.max(0.3, prev * delta)));
  }, []);

  // ─── Draw ───
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      const { width: w, height: h } = dimensions;
      const dpr = window.devicePixelRatio || 1;

      // Clear with dark background
      ctx.clearRect(0, 0, w * dpr, h * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Background gradient
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      gradient.addColorStop(0, "#0F172A"); // slate-900
      gradient.addColorStop(0.5, "#0C1222");
      gradient.addColorStop(1, "#020617"); // slate-950
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Draw background stars (decorative)
      drawBackgroundStars(ctx, w, h, time);

      // Build star position lookup
      const starPositions = new Map<string, { x: number; y: number }>();
      for (const star of data.stars) {
        starPositions.set(star.id, worldToCanvas(star.x, star.y));
      }

      // Draw edges (constellation lines)
      for (const edge of data.edges) {
        const fromPos = starPositions.get(edge.from);
        const toPos = starPositions.get(edge.to);
        if (!fromPos || !toPos) continue;

        const fromStar = data.stars.find((s) => s.id === edge.from);
        const toStar = data.stars.find((s) => s.id === edge.to);

        // Edge color based on the "weaker" star
        const edgeState =
          fromStar && toStar
            ? fromStar.state === "dim" || toStar.state === "dim"
              ? "dim"
              : fromStar.state === "bright" && toStar.state === "bright"
                ? "bright"
                : "glowing"
            : "dim";

        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.strokeStyle = EDGE_COLORS[edgeState];
        ctx.lineWidth = edgeState === "bright" ? 2 : 1;
        ctx.stroke();
      }

      // Draw stars
      for (const star of data.stars) {
        const pos = starPositions.get(star.id);
        if (!pos) continue;

        const isSelected = star.id === selectedStarId;
        drawStar(ctx, pos.x, pos.y, star, time, isSelected, showLabels);
      }

      ctx.restore();
    },
    [data, dimensions, worldToCanvas, selectedStarId, showLabels]
  );

  // ─── Animation loop ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;

    if (!animate) {
      draw(ctx, 0);
      return;
    }

    const loop = () => {
      timeRef.current += 0.016; // ~60fps
      draw(ctx, timeRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate, draw, dimensions]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        width: propWidth ?? "100%",
        height: propHeight ?? "100%",
        minHeight: 400,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          cursor: isDragging.current ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Constellation name overlay */}
      <div className="absolute top-4 left-4 text-white/80">
        <h3 className="text-lg font-semibold">{data.name}</h3>
        <p className="text-sm text-white/50">{data.subject}</p>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 text-white/80 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: STAR_COLORS.bright }}
          />
          <span>
            {data.stars.filter((s) => s.state === "bright" || s.state === "pulsing").length} mastered
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: STAR_COLORS.glowing }}
          />
          <span>{data.stars.filter((s) => s.state === "glowing").length} learning</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: STAR_COLORS.dim }}
          />
          <span>{data.stars.filter((s) => s.state === "dim").length} undiscovered</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setScale((s) => Math.min(3, s * 1.2))}
          className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-lg"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.3, s * 0.8))}
          className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-lg"
        >
          -
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xs"
        >
          R
        </button>
      </div>
    </div>
  );
}

// ─── Drawing Helpers ───

function drawBackgroundStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  // Seeded pseudo-random for consistent background stars
  const count = 120;
  for (let i = 0; i < count; i++) {
    const seed = i * 7919;
    const x = ((seed * 13) % 10000) / 10000 * w;
    const y = ((seed * 17) % 10000) / 10000 * h;
    const size = ((seed * 23) % 100) / 100 * 1.5 + 0.5;
    const twinkle = Math.sin(time * 2 + seed) * 0.3 + 0.7;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.3})`;
    ctx.fill();
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  star: StarNode,
  time: number,
  isSelected: boolean,
  showLabel: boolean
) {
  const baseRadius = star.state === "dim" ? 4 : star.state === "glowing" ? 6 : 8;
  const color = STAR_COLORS[star.state];
  const glowColor = STAR_GLOW_COLORS[star.state];

  // Pulsing animation for recently mastered
  let radius = baseRadius;
  if (star.state === "pulsing") {
    radius += Math.sin(time * 4) * 3;
  }
  if (isSelected) {
    radius += 2;
  }

  // Outer glow
  if (star.state !== "dim") {
    const glowRadius = radius * 3;
    const glow = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Star core
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Inner highlight
  if (star.state === "bright" || star.state === "pulsing") {
    ctx.beginPath();
    ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fill();
  }

  // Selection ring
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Due for review — pulsing orange ring (Phase 8)
  if (star.dueForReview && !isSelected) {
    const ringRadius = radius + 8;
    const ringAlpha = 0.4 + Math.sin(time * 3) * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(251, 146, 60, ${ringAlpha})`; // orange-400
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Label
  if (showLabel && (star.state !== "dim" || isSelected)) {
    ctx.font = isSelected ? "bold 12px sans-serif" : "11px sans-serif";
    ctx.fillStyle = star.state === "dim" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";
    ctx.fillText(star.name, x, y + radius + 16);
  }
}

// ─── Helper: Generate constellation data from knowledge graph ───

/**
 * Convert knowledge graph nodes into constellation layout.
 * Uses a simple force-directed-ish grid layout.
 */
export function generateConstellationLayout(
  nodes: Array<{
    id: string;
    name: string;
    subject: string;
    masteryLevel: number;
    masteryStatus: string;
    dueForReview?: boolean;
  }>,
  edges: Array<{ from: string; to: string }>
): ConstellationData {
  const cols = Math.ceil(Math.sqrt(nodes.length));

  const stars: StarNode[] = nodes.map((node, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Add some organic variation
    const jitterX = (hashCode(node.id) % 100) / 500;
    const jitterY = (hashCode(node.id + "y") % 100) / 500;

    return {
      id: node.id,
      name: node.name,
      x: Math.min(1, Math.max(0, col / Math.max(1, cols - 1) + jitterX)),
      y: Math.min(1, Math.max(0, row / Math.max(1, Math.ceil(nodes.length / cols) - 1) + jitterY)),
      state: getStarState(node.masteryStatus, node.masteryLevel),
      level: node.masteryLevel,
      subject: node.subject,
      dueForReview: node.dueForReview ?? false,
    };
  });

  return {
    stars,
    edges,
    name: nodes[0]?.subject ? `${nodes[0].subject} Constellation` : "Constellation",
    subject: nodes[0]?.subject ?? "Unknown",
  };
}

function getStarState(status: string, level: number): StarState {
  if (status === "MASTERED" || status === "RETAINED") return "bright";
  if (status === "PRACTICING" || level >= 2) return "glowing";
  if (status === "EXPOSED" || level >= 1) return "glowing";
  return "dim";
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}
