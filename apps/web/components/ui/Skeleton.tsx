"use client";

/**
 * Skeleton — Reusable loading placeholder component.
 *
 * Provides shimmer-animated placeholders for content that
 * takes >500ms to load. Matches the actual content shape
 * to minimize layout shift.
 */

import { type CSSProperties } from "react";

interface SkeletonProps {
  /** Shape variant */
  variant?: "text" | "rect" | "circle" | "card";
  /** Width in px or CSS string (e.g. "100%", "200px") */
  width?: number | string;
  /** Height in px or CSS string */
  height?: number | string;
  /** Number of text lines to render (only for variant="text") */
  lines?: number;
  /** Additional className */
  className?: string;
}

function formatSize(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * Single skeleton element.
 */
function SkeletonBase({
  width,
  height,
  className = "",
  style,
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`bg-gray-200 animate-pulse rounded ${className}`}
      style={{
        width: formatSize(width),
        height: formatSize(height),
        ...style,
      }}
    />
  );
}

export default function Skeleton({
  variant = "rect",
  width,
  height,
  lines = 3,
  className = "",
}: SkeletonProps) {
  switch (variant) {
    case "circle":
      return (
        <SkeletonBase
          width={width ?? 40}
          height={height ?? width ?? 40}
          className={`rounded-full ${className}`}
        />
      );

    case "text":
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBase
              key={i}
              width={i === lines - 1 ? "60%" : "100%"}
              height={14}
              className="rounded"
            />
          ))}
        </div>
      );

    case "card":
      return (
        <div
          className={`bg-white rounded-xl border border-gray-100 p-5 space-y-3 ${className}`}
          style={{
            width: formatSize(width),
            height: formatSize(height),
          }}
        >
          {/* Header row */}
          <div className="flex items-center gap-3">
            <SkeletonBase width={40} height={40} className="rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBase width="50%" height={14} />
              <SkeletonBase width="30%" height={12} />
            </div>
          </div>
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            <SkeletonBase height={48} className="rounded-lg" />
            <SkeletonBase height={48} className="rounded-lg" />
            <SkeletonBase height={48} className="rounded-lg" />
          </div>
          {/* Progress bar */}
          <SkeletonBase width="100%" height={8} className="rounded-full" />
          {/* Button row */}
          <div className="flex gap-2 pt-1">
            <SkeletonBase width="48%" height={36} className="rounded-lg" />
            <SkeletonBase width="48%" height={36} className="rounded-lg" />
          </div>
        </div>
      );

    default: // "rect"
      return (
        <SkeletonBase
          width={width ?? "100%"}
          height={height ?? 20}
          className={className}
        />
      );
  }
}

/**
 * Dashboard skeleton — shows 2 card skeletons in a grid.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <SkeletonBase width="40%" height={28} />
        <SkeletonBase width="25%" height={14} />
      </div>
      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

/**
 * Detail page skeleton — header + tabs + content area.
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBase width={40} height={40} className="rounded-full" />
          <div className="space-y-2">
            <SkeletonBase width={120} height={18} />
            <SkeletonBase width={60} height={12} />
          </div>
        </div>
        <SkeletonBase width={120} height={36} className="rounded-lg" />
      </div>
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-100 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBase key={i} width={80} height={32} className="rounded-lg" />
        ))}
      </div>
      {/* Content */}
      <div className="space-y-4">
        <SkeletonBase width="100%" height={160} className="rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <SkeletonBase height={100} className="rounded-xl" />
          <SkeletonBase height={100} className="rounded-xl" />
          <SkeletonBase height={100} className="rounded-xl" />
        </div>
      </div>
    </div>
  );
}
