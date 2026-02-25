"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface NexusScoreProps {
  score: number; // 0-100
  accuracy?: number; // 0-40 contribution
  speed?: number; // 0-30 contribution
  retention?: number; // 0-30 contribution
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
  animate?: boolean;
}

export default function NexusScore({
  score,
  accuracy,
  speed,
  retention,
  size = "md",
  showBreakdown = true,
  animate = true,
}: NexusScoreProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);

  // Animate score counting up
  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), score);
      setDisplayScore(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animate]);

  // Size config
  const sizeConfig = {
    sm: { circle: 64, stroke: 4, fontSize: "text-lg", labelSize: "text-[8px]" },
    md: { circle: 96, stroke: 5, fontSize: "text-2xl", labelSize: "text-[10px]" },
    lg: { circle: 128, stroke: 6, fontSize: "text-3xl", labelSize: "text-xs" },
  };
  const config = sizeConfig[size];
  const radius = (config.circle - config.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;

  // Color based on score
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", text: "text-green-400", glow: "shadow-green-500/30" };
    if (s >= 60) return { stroke: "#eab308", text: "text-yellow-400", glow: "shadow-yellow-500/30" };
    if (s >= 40) return { stroke: "#f97316", text: "text-orange-400", glow: "shadow-orange-500/30" };
    return { stroke: "#ef4444", text: "text-red-400", glow: "shadow-red-500/30" };
  };
  const color = getColor(displayScore);

  return (
    <div className="flex flex-col items-center">
      {/* Circular gauge */}
      <div className={`relative shadow-lg rounded-full ${color.glow}`} style={{ width: config.circle, height: config.circle }}>
        <svg
          width={config.circle}
          height={config.circle}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={config.stroke}
          />
          {/* Progress arc */}
          <motion.circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: animate ? 1 : 0, ease: "easeOut" }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${config.fontSize} font-bold ${color.text}`}>
            {displayScore}
          </span>
          <span className={`${config.labelSize} text-gray-500 uppercase tracking-wider`}>
            Nexus
          </span>
        </div>
      </div>

      {/* Breakdown bars */}
      {showBreakdown && accuracy !== undefined && speed !== undefined && retention !== undefined && (
        <div className="mt-3 w-full max-w-[120px] space-y-1.5">
          <BreakdownBar label="Accuracy" value={accuracy} max={40} color="bg-blue-500" />
          <BreakdownBar label="Speed" value={speed} max={30} color="bg-green-500" />
          <BreakdownBar label="Retention" value={retention} max={30} color="bg-purple-500" />
        </div>
      )}
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
