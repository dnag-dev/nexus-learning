"use client";

/**
 * ChildSettingsTab — Per-Child Detail Page
 *
 * All child configuration in one place:
 * Basic info, learning goal, daily target, subject focus, kid login.
 */

import { useState, useEffect } from "react";
import { COUNTRIES, getCountry } from "@/lib/data/countries";
import {
  GRADE_OPTIONS,
  AGE_GROUP_OPTIONS,
  LEARNING_GOALS,
  TIME_STOPS,
} from "@/lib/wizard/types";

interface ChildSettingsTabProps {
  childId: string;
  parentId: string;
}

interface ChildSettings {
  displayName: string;
  gradeLevel: string;
  ageGroup: string;
  country: string | null;
  learningGoal: string | null;
  dailyMinutesTarget: number | null;
  targetDate: string | null;
  subjectFocus: string | null;
  username: string | null;
  hasKidLogin: boolean;
}

export default function ChildSettingsTab({
  childId,
  parentId,
}: ChildSettingsTabProps) {
  const [settings, setSettings] = useState<ChildSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Editable fields
  const [displayName, setDisplayName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [country, setCountry] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(20);
  const [subjectFocus, setSubjectFocus] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(
          `/api/parent/children?parentId=${parentId}`
        );
        if (res.ok) {
          const data = await res.json();
          const child = data.children?.find(
            (c: { id: string }) => c.id === childId
          );
          if (child) {
            setSettings(child);
            setDisplayName(child.displayName);
            setGradeLevel(child.gradeLevel);
            setAgeGroup(child.ageGroup);
            setCountry(child.country || "US");
            setLearningGoal(child.learningGoal || "");
            setDailyMinutes(child.dailyMinutesTarget || 20);
            setSubjectFocus(child.subjectFocus || "");
          }
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [childId, parentId]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`/api/parent/child/${childId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          gradeLevel,
          ageGroup,
          country,
          learningGoal: learningGoal || null,
          dailyMinutesTarget: dailyMinutes,
          subjectFocus: subjectFocus || null,
        }),
      });

      if (res.ok) {
        setMessage("Settings saved!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Unable to load settings.
      </div>
    );
  }

  const selectedCountry = getCountry(country);
  const sliderIndex = TIME_STOPS.findIndex((t) => t >= dailyMinutes);
  const currentIndex =
    sliderIndex === -1 ? TIME_STOPS.length - 1 : sliderIndex;

  return (
    <div className="space-y-6 max-w-xl">
      {/* Success/Error Message */}
      {message && (
        <div
          className={`px-4 py-2 rounded-lg text-sm ${
            message.includes("saved")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Basic Information
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Grade
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Age Group
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                {AGE_GROUP_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Learning Goal */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Learning Goal
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {LEARNING_GOALS.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => setLearningGoal(goal.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                learningGoal === goal.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-lg">{goal.icon}</span>
              <p className="font-medium text-gray-900 text-xs mt-1">
                {goal.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Practice Target */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Daily Practice Target
        </h4>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-2xl font-bold text-purple-600">
            {dailyMinutes} min
          </span>
          <span className="text-sm text-gray-500">per day</span>
        </div>
        <input
          type="range"
          min={0}
          max={TIME_STOPS.length - 1}
          value={currentIndex}
          onChange={(e) =>
            setDailyMinutes(TIME_STOPS[parseInt(e.target.value)])
          }
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between mt-1">
          {TIME_STOPS.map((t) => (
            <span key={t} className="text-xs text-gray-400">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Subject Focus */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Subject Focus
        </h4>
        <div className="flex gap-2">
          {[
            { value: "MATH", label: "Math", icon: "🔢" },
            { value: "ENGLISH", label: "English", icon: "📚" },
            { value: "BOTH", label: "Both", icon: "🎯" },
          ].map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSubjectFocus(s.value)}
              className={`flex-1 py-3 rounded-lg border-2 text-center transition-all ${
                subjectFocus === s.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xl block">{s.icon}</span>
              <span className="text-xs font-medium text-gray-700 mt-1 block">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Kid Login Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Kid Login
        </h4>
        {settings.hasKidLogin ? (
          <p className="text-sm text-gray-600">
            Username: <strong>{settings.username}</strong> · PIN set ✓
            <br />
            <span className="text-xs text-gray-400">
              Manage in{" "}
              <a
                href="/settings"
                className="text-purple-600 hover:underline"
              >
                Account Settings
              </a>
            </span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            No kid login set up.{" "}
            <a
              href="/settings"
              className="text-purple-600 hover:underline"
            >
              Set up in Account Settings →
            </a>
          </p>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !displayName.trim()}
        className="w-full py-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
