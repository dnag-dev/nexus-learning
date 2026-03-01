"use client";

import { useState } from "react";
import Link from "next/link";
import { useParent } from "@/lib/parent-context";

const PLANS = [
  {
    key: "SPARK",
    name: "Spark",
    price: "Free",
    period: "",
    description: "Get started with the basics",
    features: [
      "1 child profile",
      "Core math & English",
      "Basic progress reports",
      "AI-powered tutoring",
    ],
    highlight: false,
  },
  {
    key: "PRO",
    name: "Grow",
    price: "$9.99",
    period: "/mo",
    description: "For families ready to accelerate",
    features: [
      "Up to 3 child profiles",
      "All subjects & grade levels",
      "Detailed insights & reports",
      "Learning GPS with milestones",
      "Priority email support",
    ],
    highlight: true,
  },
  {
    key: "FAMILY",
    name: "Family",
    price: "$19.99",
    period: "/mo",
    description: "Everything, for the whole family",
    features: [
      "Unlimited child profiles",
      "All Grow features included",
      "Advanced analytics dashboard",
      "Custom learning goals",
      "Priority support & onboarding",
    ],
    highlight: false,
  },
];

export default function PricingPage() {
  const { parentId, plan } = useParent();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (planKey: string) => {
    setUpgrading(planKey);
    setError(null);
    setSuccessPlan(null);

    try {
      const res = await fetch("/api/parent/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, plan: planKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to upgrade");
        return;
      }

      setSuccessPlan(planKey);
      // Reload page after a brief delay so parent context refreshes with new plan
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  // Determine plan rank for comparison
  const planRank: Record<string, number> = { SPARK: 0, PRO: 1, FAMILY: 2 };
  const currentRank = planRank[plan] ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <Link
          href="/settings"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          &larr; Back to Settings
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">
          Choose Your Plan
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Unlock more features to support your child&apos;s learning journey.
        </p>
      </div>

      {/* Success banner */}
      {successPlan && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
          &#10003; Successfully upgraded to{" "}
          {PLANS.find((p) => p.key === successPlan)?.name}! Refreshing...
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((p) => {
          const isCurrent = plan === p.key;
          const isUpgrade = (planRank[p.key] ?? 0) > currentRank;
          const isDowngrade = (planRank[p.key] ?? 0) < currentRank;
          const isLoading = upgrading === p.key;

          return (
            <div
              key={p.key}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                p.highlight
                  ? "border-purple-300 bg-purple-50/50 shadow-md shadow-purple-100"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Popular badge */}
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              {/* Plan header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className="text-3xl font-bold text-gray-900">
                  {p.price}
                </span>
                {p.period && (
                  <span className="text-sm text-gray-500">{p.period}</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="text-green-500 mt-0.5 shrink-0">
                      &#10003;
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="py-2.5 text-center text-sm font-medium text-gray-500 bg-gray-100 rounded-xl">
                  Current Plan
                </div>
              ) : isUpgrade ? (
                <button
                  onClick={() => handleUpgrade(p.key)}
                  disabled={isLoading || upgrading !== null}
                  className="py-2.5 text-center text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isLoading
                    ? "Upgrading..."
                    : `Upgrade to ${p.name}`}
                </button>
              ) : isDowngrade ? (
                <div className="py-2.5 text-center text-sm font-medium text-gray-400 bg-gray-50 rounded-xl">
                  Included in your plan
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* FAQ / Note */}
      <div className="text-center text-xs text-gray-400 pb-4">
        <p>
          All plans include AI-powered adaptive tutoring. Upgrade or downgrade
          anytime.
        </p>
        <p className="mt-1">
          Questions?{" "}
          <a href="#" className="text-purple-500 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
