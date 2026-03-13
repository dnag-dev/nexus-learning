"use client";

/**
 * CoordinatePlane — Interactive SVG coordinate plane for web sessions.
 *
 * Renders a grid with:
 * - Axis lines with arrows and labels (x, y)
 * - Grid lines at integer intervals
 * - Quadrant labels (I, II, III, IV) when showing negative quadrants
 * - Hover crosshairs showing (x, y) coordinates
 * - Click to place a point
 * - Feedback: green for correct, red for incorrect
 *
 * Used for coordinate plane questions where students plot a point.
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CoordinatePlaneProps {
  /** Minimum grid value (e.g., -10 or 0) */
  gridMin: number;
  /** Maximum grid value (e.g., 10 or 6) */
  gridMax: number;
  /** Correct x coordinate */
  correctX: number;
  /** Correct y coordinate */
  correctY: number;
  /** Tolerance for accepting an answer (default: 0.5) */
  tolerance?: number;
  /** Called when user places a point */
  onAnswer: (x: number, y: number, isCorrect: boolean) => void;
  /** Whether the question has been answered */
  answered: boolean;
  /** Whether the placed answer was correct */
  wasCorrect?: boolean;
  /** The x coordinate the user placed */
  placedX?: number;
  /** The y coordinate the user placed */
  placedY?: number;
  /** Whether interaction is disabled */
  disabled?: boolean;
}

// ─── Constants ───

const SVG_SIZE = 400; // Viewport size
const PADDING = 40; // Padding for axis labels
const GRID_AREA = SVG_SIZE - 2 * PADDING;

export default function CoordinatePlane({
  gridMin,
  gridMax,
  correctX,
  correctY,
  tolerance = 0.5,
  onAnswer,
  answered,
  wasCorrect,
  placedX,
  placedY,
  disabled = false,
}: CoordinatePlaneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(
    placedX !== undefined && placedY !== undefined ? { x: placedX, y: placedY } : null
  );

  const gridRange = gridMax - gridMin;
  const showNegative = gridMin < 0;

  // ─── Coordinate ↔ SVG transformations ───

  const coordToSvg = useCallback(
    (cx: number, cy: number) => ({
      x: PADDING + ((cx - gridMin) / gridRange) * GRID_AREA,
      y: PADDING + ((gridMax - cy) / gridRange) * GRID_AREA,
    }),
    [gridMin, gridMax, gridRange]
  );

  const svgToCoord = useCallback(
    (sx: number, sy: number) => ({
      x: Math.round(gridMin + ((sx - PADDING) / GRID_AREA) * gridRange),
      y: Math.round(gridMax - ((sy - PADDING) / GRID_AREA) * gridRange),
    }),
    [gridMin, gridMax, gridRange]
  );

  // ─── Grid lines ───

  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; isAxis: boolean }[] = [];

    for (let i = gridMin; i <= gridMax; i++) {
      const hPos = coordToSvg(i, gridMin);
      const hPosEnd = coordToSvg(i, gridMax);
      lines.push({
        x1: hPos.x,
        y1: PADDING,
        x2: hPos.x,
        y2: PADDING + GRID_AREA,
        isAxis: i === 0,
      });

      const vPos = coordToSvg(gridMin, i);
      const vPosEnd = coordToSvg(gridMax, i);
      lines.push({
        x1: PADDING,
        y1: vPos.y,
        x2: PADDING + GRID_AREA,
        y2: vPos.y,
        isAxis: i === 0,
      });
    }

    return lines;
  }, [gridMin, gridMax, coordToSvg]);

  // ─── Axis tick labels ───

  const tickLabels = useMemo(() => {
    const labels: { x: number; y: number; text: string; axis: "x" | "y" }[] = [];
    const step = gridRange > 12 ? 2 : 1;

    for (let i = gridMin; i <= gridMax; i += step) {
      if (i === 0 && showNegative) continue; // Skip 0 label at origin when axes cross
      const pos = coordToSvg(i, 0);
      labels.push({ x: pos.x, y: pos.y + 16, text: String(i), axis: "x" });

      const posY = coordToSvg(0, i);
      labels.push({ x: posY.x - 12, y: posY.y + 4, text: String(i), axis: "y" });
    }

    return labels;
  }, [gridMin, gridMax, gridRange, showNegative, coordToSvg]);

  // ─── Quadrant labels ───

  const quadrantLabels = useMemo(() => {
    if (!showNegative) return [];

    const midPos = gridMax / 2;
    const midNeg = gridMin / 2;

    return [
      { ...coordToSvg(midPos, midPos), text: "I", color: "rgba(6, 182, 212, 0.15)" },
      { ...coordToSvg(midNeg, midPos), text: "II", color: "rgba(167, 139, 250, 0.15)" },
      { ...coordToSvg(midNeg, midNeg), text: "III", color: "rgba(248, 113, 113, 0.15)" },
      { ...coordToSvg(midPos, midNeg), text: "IV", color: "rgba(52, 211, 153, 0.15)" },
    ];
  }, [showNegative, gridMax, gridMin, coordToSvg]);

  // ─── Mouse handlers ───

  const getMouseCoord = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return null;

      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_SIZE / rect.width;
      const scaleY = SVG_SIZE / rect.height;
      const sx = (e.clientX - rect.left) * scaleX;
      const sy = (e.clientY - rect.top) * scaleY;

      const coord = svgToCoord(sx, sy);

      // Clamp to grid bounds
      coord.x = Math.max(gridMin, Math.min(gridMax, coord.x));
      coord.y = Math.max(gridMin, Math.min(gridMax, coord.y));

      return coord;
    },
    [svgToCoord, gridMin, gridMax]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || answered) return;
      const coord = getMouseCoord(e);
      if (coord) setHoverPos(coord);
    },
    [disabled, answered, getMouseCoord]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || answered) return;
      const coord = getMouseCoord(e);
      if (!coord) return;

      setSelectedPoint(coord);
      setHoverPos(null);

      const dx = Math.abs(coord.x - correctX);
      const dy = Math.abs(coord.y - correctY);
      const correct = dx <= tolerance && dy <= tolerance;

      onAnswer(coord.x, coord.y, correct);
    },
    [disabled, answered, getMouseCoord, correctX, correctY, tolerance, onAnswer]
  );

  // ─── Render ───

  const origin = coordToSvg(0, 0);
  const correctSvg = coordToSvg(correctX, correctY);
  const selectedSvg = selectedPoint ? coordToSvg(selectedPoint.x, selectedPoint.y) : null;
  const hoverSvg = hoverPos ? coordToSvg(hoverPos.x, hoverPos.y) : null;

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full h-auto cursor-crosshair select-none"
        style={{ touchAction: "none" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Background */}
        <rect
          x={PADDING}
          y={PADDING}
          width={GRID_AREA}
          height={GRID_AREA}
          fill="#0c1628"
          rx={4}
        />

        {/* Quadrant labels */}
        {quadrantLabels.map((q) => (
          <text
            key={q.text}
            x={q.x}
            y={q.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={q.color}
            fontSize={28}
            fontWeight="bold"
            style={{ pointerEvents: "none" }}
          >
            {q.text}
          </text>
        ))}

        {/* Grid lines */}
        {gridLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.isAxis ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.08)"}
            strokeWidth={line.isAxis ? 2 : 0.5}
          />
        ))}

        {/* Axis arrows */}
        {/* X-axis arrow */}
        <polygon
          points={`${PADDING + GRID_AREA + 5},${origin.y} ${PADDING + GRID_AREA - 5},${origin.y - 4} ${PADDING + GRID_AREA - 5},${origin.y + 4}`}
          fill="rgba(255,255,255,0.4)"
        />
        <text
          x={PADDING + GRID_AREA + 10}
          y={origin.y + 4}
          fill="rgba(255,255,255,0.5)"
          fontSize={12}
          fontWeight="bold"
        >
          x
        </text>
        {/* Y-axis arrow */}
        <polygon
          points={`${origin.x},${PADDING - 5} ${origin.x - 4},${PADDING + 5} ${origin.x + 4},${PADDING + 5}`}
          fill="rgba(255,255,255,0.4)"
        />
        <text
          x={origin.x + 6}
          y={PADDING - 6}
          fill="rgba(255,255,255,0.5)"
          fontSize={12}
          fontWeight="bold"
        >
          y
        </text>

        {/* Tick labels */}
        {tickLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={9}
            style={{ pointerEvents: "none" }}
          >
            {label.text}
          </text>
        ))}

        {/* Hover crosshairs */}
        {hoverSvg && !answered && (
          <g style={{ pointerEvents: "none" }}>
            {/* Vertical crosshair */}
            <line
              x1={hoverSvg.x}
              y1={PADDING}
              x2={hoverSvg.x}
              y2={PADDING + GRID_AREA}
              stroke="rgba(6, 182, 212, 0.3)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            {/* Horizontal crosshair */}
            <line
              x1={PADDING}
              y1={hoverSvg.y}
              x2={PADDING + GRID_AREA}
              y2={hoverSvg.y}
              stroke="rgba(6, 182, 212, 0.3)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            {/* Hover dot */}
            <circle
              cx={hoverSvg.x}
              cy={hoverSvg.y}
              r={5}
              fill="rgba(6, 182, 212, 0.5)"
              stroke="#06b6d4"
              strokeWidth={1.5}
            />
            {/* Coordinate label */}
            <rect
              x={hoverSvg.x + 8}
              y={hoverSvg.y - 20}
              width={55}
              height={18}
              rx={4}
              fill="rgba(6, 182, 212, 0.85)"
            />
            <text
              x={hoverSvg.x + 35}
              y={hoverSvg.y - 8}
              textAnchor="middle"
              fill="white"
              fontSize={11}
              fontWeight="600"
              style={{ pointerEvents: "none" }}
            >
              ({hoverPos!.x}, {hoverPos!.y})
            </text>
          </g>
        )}

        {/* Selected point (user's answer) */}
        {selectedSvg && (
          <g>
            <circle
              cx={selectedSvg.x}
              cy={selectedSvg.y}
              r={8}
              fill={
                !answered
                  ? "#06b6d4" // cyan while unconfirmed
                  : wasCorrect
                    ? "#34d399" // green
                    : "#f87171" // red
              }
              stroke="white"
              strokeWidth={2}
              opacity={0.9}
            />
            {answered && (
              <text
                x={selectedSvg.x}
                y={selectedSvg.y - 14}
                textAnchor="middle"
                fill={wasCorrect ? "#34d399" : "#f87171"}
                fontSize={11}
                fontWeight="bold"
              >
                ({selectedPoint!.x}, {selectedPoint!.y})
              </text>
            )}
          </g>
        )}

        {/* Show correct answer after wrong */}
        {answered && !wasCorrect && (
          <g>
            {/* Correct point */}
            <circle
              cx={correctSvg.x}
              cy={correctSvg.y}
              r={8}
              fill="#34d399"
              stroke="white"
              strokeWidth={2}
              opacity={0.9}
            />
            <text
              x={correctSvg.x}
              y={correctSvg.y - 14}
              textAnchor="middle"
              fill="#34d399"
              fontSize={11}
              fontWeight="bold"
            >
              ({correctX}, {correctY}) ✓
            </text>
          </g>
        )}
      </svg>

      {/* Instruction text */}
      {!answered && !selectedPoint && (
        <p className="text-center text-sm text-gray-400 mt-2">
          Click on the grid to place your point
        </p>
      )}
    </div>
  );
}
