"use client";

/**
 * Wizard Step 1: Basic Info
 *
 * Name, grade, age group, country (searchable), optional username + PIN.
 */

import { useState } from "react";
import type { WizardState } from "@/lib/wizard/types";
import { GRADE_OPTIONS, AGE_GROUP_OPTIONS } from "@/lib/wizard/types";
import { COUNTRIES, searchCountries } from "@/lib/data/countries";

interface StepBasicInfoProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export default function StepBasicInfo({ state, onChange }: StepBasicInfoProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const filteredCountries = searchCountries(countrySearch);
  const selectedCountry = COUNTRIES.find((c) => c.code === state.country);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Tell us about your child
        </h3>
        <p className="text-sm text-gray-500">
          We&apos;ll use this to personalize their learning experience.
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Child&apos;s Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={state.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          placeholder="e.g. Arjun"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          autoFocus
        />
      </div>

      {/* Grade + Age Group */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade Level
          </label>
          <select
            value={state.gradeLevel}
            onChange={(e) => onChange({ gradeLevel: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age Group
          </label>
          <select
            value={state.ageGroup}
            onChange={(e) => onChange({ ageGroup: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            {AGE_GROUP_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Country */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country
        </label>
        <button
          type="button"
          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-left flex items-center gap-2 hover:bg-gray-50"
        >
          <span>{selectedCountry?.flag || ""}</span>
          <span>{selectedCountry?.name || "Select country"}</span>
        </button>

        {showCountryDropdown && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange({ country: c.code });
                    setShowCountryDropdown(false);
                    setCountrySearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-purple-50 ${
                    state.country === c.code
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-700"
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Kid Login (optional) */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500 mb-3">
          <strong>Optional:</strong> Set up a Kid Login so your child can sign
          in independently
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={state.username}
              onChange={(e) =>
                onChange({
                  username: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                })
              }
              placeholder="e.g. arjun_star"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              4-Digit PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={state.pin}
              onChange={(e) =>
                onChange({
                  pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                })
              }
              placeholder="e.g. 5728"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              maxLength={4}
            />
          </div>
        </div>
        {state.pin && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={state.pinConfirm}
              onChange={(e) =>
                onChange({
                  pinConfirm: e.target.value.replace(/\D/g, "").slice(0, 4),
                })
              }
              placeholder="Re-enter PIN"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 ${
                state.pinConfirm && state.pinConfirm !== state.pin
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              maxLength={4}
            />
            {state.pinConfirm && state.pinConfirm !== state.pin && (
              <p className="text-xs text-red-500 mt-1">PINs don&apos;t match</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
