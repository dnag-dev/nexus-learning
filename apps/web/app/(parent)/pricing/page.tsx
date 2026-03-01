"use client";

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
    cta: "Current Plan",
    highlight: false,
  },
  {
    key: "GROW",
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
    cta: "Upgrade to Grow",
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
    cta: "Upgrade to Family",
    highlight: false,
  },
];

export default function PricingPage() {
  const { plan } = useParent();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <Link
          href="/settings"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to Settings
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">
          Choose Your Plan
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Unlock more features to support your child&apos;s learning journey.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((p) => {
          const isCurrent = plan === p.key;

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
              ) : (
                <button className="py-2.5 text-center text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors">
                  {p.cta} — Coming Soon
                </button>
              )}
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
