"use client";

/**
 * Review Forecast Calendar — 7-day view showing how many nodes are due each day.
 */

import { useMemo } from "react";

interface ForecastDay {
  date: string; // YYYY-MM-DD
  nodeCount: number;
  nodes: Array<{
    nodeCode: string;
    nodeTitle: string;
    bktProbability: number;
    isOverdue: boolean;
  }>;
}

interface ReviewForecastCalendarProps {
  forecast: ForecastDay[];
  className?: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ReviewForecastCalendar({
  forecast,
  className = "",
}: ReviewForecastCalendarProps) {
  const days = useMemo(() => {
    return forecast.map((day) => {
      const date = new Date(day.date + "T12:00:00");
      return {
        ...day,
        dayName: DAY_NAMES[date.getDay()],
        dayNum: date.getDate(),
        isToday: day.date === new Date().toISOString().split("T")[0],
      };
    });
  }, [forecast]);

  return (
    <div className={`bg-white rounded-xl p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Review Forecast
      </h3>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              day.isToday
                ? "bg-blue-50 ring-2 ring-blue-300"
                : day.nodeCount > 0
                  ? "bg-amber-50"
                  : "bg-gray-50"
            }`}
          >
            <span className="text-[10px] font-medium text-gray-500">
              {day.dayName}
            </span>
            <span
              className={`text-sm font-bold ${
                day.isToday ? "text-blue-600" : "text-gray-800"
              }`}
            >
              {day.dayNum}
            </span>
            {day.nodeCount > 0 ? (
              <span
                className={`mt-1 text-xs font-medium rounded-full px-1.5 py-0.5 ${
                  day.nodes.some((n) => n.isOverdue)
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {day.nodeCount}
              </span>
            ) : (
              <span className="mt-1 text-xs text-gray-300">—</span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Due</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <span>Clear</span>
        </div>
      </div>
    </div>
  );
}
