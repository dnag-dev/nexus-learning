"use client";

/**
 * AlertCard — Displays an intervention alert.
 */

export interface AlertCardData {
  id: string;
  alertType: string;
  status: string;
  title: string;
  description: string;
  studentName: string;
  studentId: string;
  createdAt: string;
}

const ALERT_TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; bgColor: string }
> = {
  REPEATED_FAILURE: {
    icon: "❌",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
  PROLONGED_ABSENCE: {
    icon: "📅",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
  },
  SUSTAINED_FRUSTRATION: {
    icon: "😟",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
  LOW_MASTERY_VELOCITY: {
    icon: "📉",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  STRUGGLING_STUDENT: {
    icon: "🆘",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
};

interface AlertCardProps {
  alert: AlertCardData;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export default function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
}: AlertCardProps) {
  const config = ALERT_TYPE_CONFIG[alert.alertType] || {
    icon: "⚠️",
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
  };

  const timeAgo = getTimeAgo(alert.createdAt);

  return (
    <div className={`rounded-xl border p-4 ${config.bgColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${config.color}`}>
              {alert.title}
            </h4>
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
          <p className="text-xs text-gray-500">
            Student: <span className="font-medium">{alert.studentName}</span>
          </p>
        </div>
      </div>

      {alert.status === "ALERT_ACTIVE" && (
        <div className="flex gap-2 mt-3 ml-9">
          {onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Acknowledge
            </button>
          )}
          {onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      )}

      {alert.status === "ACKNOWLEDGED" && (
        <div className="flex gap-2 mt-3 ml-9">
          <span className="text-xs text-gray-400 italic">Acknowledged</span>
          {onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
