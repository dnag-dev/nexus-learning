"use client";

import { motion } from "framer-motion";

interface SpeedTrendProps {
  times: number[]; // response times in ms, chronological
  benchmarkMs?: number | null;
  personalBestMs?: number | null;
  height?: number;
}

export default function SpeedTrend({
  times,
  benchmarkMs,
  personalBestMs,
  height = 48,
}: SpeedTrendProps) {
  if (times.length < 2) {
    return (
      <div className="text-xs text-gray-500 text-center py-2">
        Need more data for speed trend
      </div>
    );
  }

  const maxTime = Math.max(...times, benchmarkMs ?? 0);
  const minTime = Math.min(...times);
  const range = maxTime - minTime || 1;

  // Calculate trend direction
  const firstHalf = times.slice(0, Math.floor(times.length / 2));
  const secondHalf = times.slice(Math.floor(times.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const improving = avgSecond < avgFirst * 0.95;
  const slowing = avgSecond > avgFirst * 1.05;

  const formatMs = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="w-full">
      {/* Trend label */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          Speed Trend
        </span>
        <span
          className={`text-[10px] font-medium ${
            improving
              ? "text-green-400"
              : slowing
                ? "text-red-400"
                : "text-gray-400"
          }`}
        >
          {improving ? "Improving" : slowing ? "Slowing" : "Steady"}
          {improving ? " ↓" : slowing ? " ↑" : " →"}
        </span>
      </div>

      {/* Sparkline */}
      <div className="relative" style={{ height }}>
        {/* Benchmark line */}
        {benchmarkMs && benchmarkMs <= maxTime && (
          <div
            className="absolute w-full border-t border-dashed border-yellow-500/30"
            style={{
              bottom: `${((maxTime - benchmarkMs) / range) * 100}%`,
            }}
          >
            <span className="absolute -top-3 right-0 text-[8px] text-yellow-500/60">
              target
            </span>
          </div>
        )}

        {/* Bars */}
        <div className="flex items-end gap-0.5 h-full">
          {times.map((ms, i) => {
            const barHeight = ((maxTime - ms) / range) * 100;
            // Invert: shorter time = taller bar (faster is better)
            const invertedHeight = 100 - barHeight;
            const isBelowBenchmark = benchmarkMs ? ms <= benchmarkMs : false;
            const isPersonalBest = personalBestMs ? ms === personalBestMs : false;

            return (
              <div key={i} className="flex-1 relative group" style={{ height: "100%" }}>
                <motion.div
                  className={`absolute bottom-0 w-full rounded-t transition-colors ${
                    isPersonalBest
                      ? "bg-yellow-500"
                      : isBelowBenchmark
                        ? "bg-green-500/70"
                        : "bg-white/20"
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(invertedHeight, 8)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                    {formatMs(ms)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal best */}
      {personalBestMs && (
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-[9px] text-gray-500">Best:</span>
          <span className="text-[9px] font-semibold text-yellow-400">
            {formatMs(personalBestMs)}
          </span>
        </div>
      )}
    </div>
  );
}
