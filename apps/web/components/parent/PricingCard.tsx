/**
 * PricingCard — Phase 10: Billing
 *
 * Displays a single plan card with features, price, and CTA button.
 * Used on the pricing/billing page.
 */

"use client";

import { type PlanConfig } from "../../lib/billing/stripe-client";

// ─── Types ───

export interface PricingCardProps {
  plan: PlanConfig;
  currentPlan: string | null;
  isLoading: boolean;
  onSelect: (planKey: string) => void;
}

// ─── Plan Display ───

export const PLAN_ICONS: Record<string, string> = {
  SPARK: "⚡",
  PRO: "🚀",
  FAMILY: "👨‍👩‍👧‍👦",
  ANNUAL: "🏆",
};

export const PLAN_BADGE_COLORS: Record<string, string> = {
  SPARK: "bg-gray-100 text-gray-700 border-gray-200",
  PRO: "bg-purple-100 text-purple-700 border-purple-200",
  FAMILY: "bg-blue-100 text-blue-700 border-blue-200",
  ANNUAL: "bg-amber-100 text-amber-700 border-amber-200",
};

/**
 * Format price in INR.
 */
export function formatINR(amount: number): string {
  if (amount === 0) return "Free";
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Get the price display string with interval.
 */
export function getPriceDisplay(plan: PlanConfig): string {
  if (plan.priceINR === 0) return "Free forever";
  const interval = plan.interval === "year" ? "/year" : "/month";
  return `${formatINR(plan.priceINR)}${interval}`;
}

/**
 * Get CTA button text based on current plan.
 */
export function getButtonText(
  planKey: string,
  currentPlan: string | null
): string {
  if (currentPlan === planKey) return "Current Plan";
  if (planKey === "SPARK") return "Downgrade";
  if (!currentPlan || currentPlan === "SPARK") return "Get Started";
  return "Switch Plan";
}

/**
 * Get CTA button style.
 */
export function getButtonStyle(
  planKey: string,
  currentPlan: string | null,
  isPopular: boolean
): string {
  if (currentPlan === planKey) {
    return "bg-gray-100 text-gray-500 cursor-default";
  }
  if (isPopular) {
    return "bg-purple-600 text-white hover:bg-purple-700";
  }
  return "bg-gray-900 text-white hover:bg-gray-800";
}

// ─── FAQ Data ───

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Can I change my plan anytime?",
    answer:
      "Yes! You can upgrade or downgrade at any time. When upgrading, you'll be charged the prorated difference. When downgrading, you'll keep your current plan until the end of the billing period.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! New users get a 14-day free trial of the Pro plan with full features. No credit card required to start.",
  },
  {
    question: "What happens when the trial ends?",
    answer:
      "After your 14-day trial, you'll automatically switch to the free Spark plan. You can upgrade anytime to continue with full features.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no long-term contracts. Cancel from your account settings and you'll keep access until the end of your current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, and UPI via our secure payment partner Stripe.",
  },
  {
    question: "Is the Family plan per child?",
    answer:
      "No! The Family plan is a single subscription that covers up to 4 children. Each child gets their own personalized learning experience.",
  },
];

// ─── Component ───

export default function PricingCard({
  plan,
  currentPlan,
  isLoading,
  onSelect,
}: PricingCardProps) {
  const isCurrent = currentPlan === plan.key;
  const isPopular = plan.popular ?? false;

  return (
    <div
      className={`relative rounded-2xl border-2 p-6 flex flex-col ${
        isPopular
          ? "border-purple-400 shadow-lg shadow-purple-100"
          : "border-gray-200"
      } ${isCurrent ? "ring-2 ring-purple-500 ring-offset-2" : ""}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-3xl">{PLAN_ICONS[plan.key] ?? "📦"}</span>
        <h3 className="text-xl font-bold text-gray-900 mt-2">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <span className="text-3xl font-bold text-gray-900">
          {formatINR(plan.priceINR)}
        </span>
        {plan.priceINR > 0 && (
          <span className="text-gray-500 text-sm">
            /{plan.interval === "year" ? "year" : "mo"}
          </span>
        )}
        {plan.key === "ANNUAL" && (
          <div className="text-sm text-green-600 font-medium mt-1">
            Save 2 months!
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-green-500 mt-0.5 shrink-0">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={() => !isCurrent && onSelect(plan.key)}
        disabled={isCurrent || isLoading}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${getButtonStyle(
          plan.key,
          currentPlan,
          isPopular
        )} ${isLoading ? "opacity-50 cursor-wait" : ""}`}
      >
        {isLoading ? "Processing..." : getButtonText(plan.key, currentPlan)}
      </button>

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="text-center mt-3">
          <span className="text-xs text-purple-600 font-medium">
            ✓ Your current plan
          </span>
        </div>
      )}
    </div>
  );
}
