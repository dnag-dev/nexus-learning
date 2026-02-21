"use client";

/**
 * Parent Settings Page — Phase 9: Parent Dashboard
 *
 * Account + subscription management.
 */

import { useParent } from "@/lib/parent-context";

export default function ParentSettingsPage() {
  const { email, plan } = useParent();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account, children, and subscription.
        </p>
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Subscription</span>
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {plan}
            </span>
          </div>
          <div className="flex items-center justify-between py-2" />
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Weekly report emails</span>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-purple-600 rounded"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Badge & milestone alerts
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-purple-600 rounded"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Streak reminders
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-purple-600 rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
