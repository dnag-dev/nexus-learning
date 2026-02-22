"use client";

/**
 * Alerts Page — Phase 11
 *
 * Shows all intervention alerts with status filter tabs.
 */

import { useState, useEffect } from "react";
import { useTeacher } from "@/lib/teacher-context";
import AlertCard, { type AlertCardData } from "@/components/teacher/AlertCard";

type FilterTab = "ALERT_ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "all";

export default function AlertsPage() {
  const { teacherId } = useTeacher();
  const [alerts, setAlerts] = useState<AlertCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALERT_ACTIVE");

  useEffect(() => {
    async function load() {
      if (!teacherId) return;
      try {
        const res = await fetch(`/api/teacher/${teacherId}/alerts`);
        if (res.ok) {
          setAlerts(await res.json());
        }
      } catch (err) {
        console.error("Failed to load alerts:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teacherId]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await fetch(`/api/teacher/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACKNOWLEDGED" }),
      });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: "ACKNOWLEDGED" } : a
        )
      );
    } catch (err) {
      console.error("Failed to acknowledge:", err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await fetch(`/api/teacher/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: "RESOLVED" } : a
        )
      );
    } catch (err) {
      console.error("Failed to resolve:", err);
    }
  };

  const filteredAlerts =
    activeTab === "all"
      ? alerts
      : alerts.filter((a) => a.status === activeTab);

  const tabs: Array<{ key: FilterTab; label: string; count: number }> = [
    {
      key: "ALERT_ACTIVE",
      label: "Active",
      count: alerts.filter((a) => a.status === "ALERT_ACTIVE").length,
    },
    {
      key: "ACKNOWLEDGED",
      label: "Acknowledged",
      count: alerts.filter((a) => a.status === "ACKNOWLEDGED").length,
    },
    {
      key: "RESOLVED",
      label: "Resolved",
      count: alerts.filter((a) => a.status === "RESOLVED").length,
    },
    {
      key: "all",
      label: "All",
      count: alerts.length,
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading alerts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Intervention Alerts
      </h2>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-xs ${
                  tab.key === "ALERT_ACTIVE" && tab.count > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">
            {activeTab === "ALERT_ACTIVE" ? "✅" : "🔔"}
          </div>
          <p className="text-gray-500 text-sm">
            {activeTab === "ALERT_ACTIVE"
              ? "No active alerts. Your students are doing well!"
              : `No ${activeTab === "all" ? "" : activeTab.toLowerCase().replace("_", " ")} alerts.`}
          </p>
        </div>
      )}
    </div>
  );
}
