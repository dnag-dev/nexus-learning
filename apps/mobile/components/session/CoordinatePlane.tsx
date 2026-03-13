/**
 * CoordinatePlane — Interactive coordinate plane for React Native.
 *
 * Uses react-native-svg for rendering. Touch-based interaction:
 * - Tap to place a point (snaps to nearest integer grid point)
 * - Shows coordinate label on placed point
 * - Green/red feedback after answer
 * - Shows correct answer after wrong placement
 */

import { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  GestureResponderEvent,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import Svg, {
  Rect,
  Line,
  Circle,
  Text as SvgText,
  Polygon,
  G,
} from "react-native-svg";
import { useTheme } from "../../lib/theme";

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

const SVG_SIZE = 360;
const PADDING = 36;
const GRID_AREA = SVG_SIZE - 2 * PADDING;

export function CoordinatePlane({
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
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(SVG_SIZE);
  const [selectedPoint, setSelectedPoint] = useState<{
    x: number;
    y: number;
  } | null>(
    placedX !== undefined && placedY !== undefined
      ? { x: placedX, y: placedY }
      : null
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
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isAxis: boolean;
    }[] = [];

    for (let i = gridMin; i <= gridMax; i++) {
      const pos = coordToSvg(i, gridMin);
      lines.push({
        x1: pos.x,
        y1: PADDING,
        x2: pos.x,
        y2: PADDING + GRID_AREA,
        isAxis: i === 0,
      });

      const posH = coordToSvg(gridMin, i);
      lines.push({
        x1: PADDING,
        y1: posH.y,
        x2: PADDING + GRID_AREA,
        y2: posH.y,
        isAxis: i === 0,
      });
    }

    return lines;
  }, [gridMin, gridMax, coordToSvg]);

  // ─── Tick labels ───

  const tickLabels = useMemo(() => {
    const labels: {
      x: number;
      y: number;
      text: string;
      axis: "x" | "y";
    }[] = [];
    const step = gridRange > 12 ? 2 : 1;

    for (let i = gridMin; i <= gridMax; i += step) {
      if (i === 0 && showNegative) continue;
      const pos = coordToSvg(i, 0);
      labels.push({ x: pos.x, y: pos.y + 14, text: String(i), axis: "x" });

      const posY = coordToSvg(0, i);
      labels.push({
        x: posY.x - 10,
        y: posY.y + 3,
        text: String(i),
        axis: "y",
      });
    }

    return labels;
  }, [gridMin, gridMax, gridRange, showNegative, coordToSvg]);

  // ─── Quadrant labels ───

  const quadrantLabels = useMemo(() => {
    if (!showNegative) return [];

    const midPos = gridMax / 2;
    const midNeg = gridMin / 2;

    return [
      {
        ...coordToSvg(midPos, midPos),
        text: "I",
        color: "rgba(6, 182, 212, 0.12)",
      },
      {
        ...coordToSvg(midNeg, midPos),
        text: "II",
        color: "rgba(167, 139, 250, 0.12)",
      },
      {
        ...coordToSvg(midNeg, midNeg),
        text: "III",
        color: "rgba(248, 113, 113, 0.12)",
      },
      {
        ...coordToSvg(midPos, midNeg),
        text: "IV",
        color: "rgba(52, 211, 153, 0.12)",
      },
    ];
  }, [showNegative, gridMax, gridMin, coordToSvg]);

  // ─── Touch handler ───

  const handleTouch = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled || answered) return;

      const { locationX, locationY } = e.nativeEvent;
      // Scale from actual size to SVG viewBox
      const scale = SVG_SIZE / containerWidth;
      const svgX = locationX * scale;
      const svgY = locationY * scale;

      const coord = svgToCoord(svgX, svgY);

      // Clamp to grid bounds
      coord.x = Math.max(gridMin, Math.min(gridMax, coord.x));
      coord.y = Math.max(gridMin, Math.min(gridMax, coord.y));

      setSelectedPoint(coord);

      const dx = Math.abs(coord.x - correctX);
      const dy = Math.abs(coord.y - correctY);
      const correct = dx <= tolerance && dy <= tolerance;

      onAnswer(coord.x, coord.y, correct);
    },
    [
      disabled,
      answered,
      containerWidth,
      svgToCoord,
      gridMin,
      gridMax,
      correctX,
      correctY,
      tolerance,
      onAnswer,
    ]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  // ─── Computed positions ───

  const origin = coordToSvg(0, 0);
  const correctSvg = coordToSvg(correctX, correctY);
  const selectedSvg = selectedPoint
    ? coordToSvg(selectedPoint.x, selectedPoint.y)
    : null;

  const pointColor = !answered
    ? "#06b6d4"
    : wasCorrect
      ? "#34d399"
      : "#f87171";

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <View
        onLayout={handleLayout}
        style={{
          width: "100%",
          maxWidth: 400,
          aspectRatio: 1,
        }}
      >
        <Svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          onPress={handleTouch}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Background */}
          <Rect
            x={PADDING}
            y={PADDING}
            width={GRID_AREA}
            height={GRID_AREA}
            fill={colors.surfaceAlt}
            rx={4}
          />

          {/* Quadrant labels */}
          {quadrantLabels.map((q) => (
            <SvgText
              key={q.text}
              x={q.x}
              y={q.y}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={q.color}
              fontSize={24}
              fontWeight="bold"
            >
              {q.text}
            </SvgText>
          ))}

          {/* Grid lines */}
          {gridLines.map((line, i) => (
            <Line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={
                line.isAxis
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(255,255,255,0.06)"
              }
              strokeWidth={line.isAxis ? 1.5 : 0.5}
            />
          ))}

          {/* X-axis label */}
          <SvgText
            x={PADDING + GRID_AREA + 8}
            y={origin.y + 4}
            fill="rgba(255,255,255,0.45)"
            fontSize={11}
            fontWeight="bold"
          >
            x
          </SvgText>

          {/* Y-axis label */}
          <SvgText
            x={origin.x + 5}
            y={PADDING - 6}
            fill="rgba(255,255,255,0.45)"
            fontSize={11}
            fontWeight="bold"
          >
            y
          </SvgText>

          {/* Tick labels */}
          {tickLabels.map((label, i) => (
            <SvgText
              key={i}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize={8}
            >
              {label.text}
            </SvgText>
          ))}

          {/* Selected point (user's answer) */}
          {selectedSvg && (
            <G>
              <Circle
                cx={selectedSvg.x}
                cy={selectedSvg.y}
                r={7}
                fill={pointColor}
                stroke="white"
                strokeWidth={1.5}
                opacity={0.9}
              />
              {answered && (
                <SvgText
                  x={selectedSvg.x}
                  y={selectedSvg.y - 12}
                  textAnchor="middle"
                  fill={pointColor}
                  fontSize={10}
                  fontWeight="bold"
                >
                  ({selectedPoint!.x}, {selectedPoint!.y})
                </SvgText>
              )}
            </G>
          )}

          {/* Show correct answer after wrong */}
          {answered && !wasCorrect && (
            <G>
              <Circle
                cx={correctSvg.x}
                cy={correctSvg.y}
                r={7}
                fill="#34d399"
                stroke="white"
                strokeWidth={1.5}
                opacity={0.9}
              />
              <SvgText
                x={correctSvg.x}
                y={correctSvg.y - 12}
                textAnchor="middle"
                fill="#34d399"
                fontSize={10}
                fontWeight="bold"
              >
                ({correctX}, {correctY})
              </SvgText>
            </G>
          )}
        </Svg>
      </View>

      {/* Instruction text */}
      {!answered && !selectedPoint && (
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Tap on the grid to place your point
        </Text>
      )}
    </View>
  );
}
