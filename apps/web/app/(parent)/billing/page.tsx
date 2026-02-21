/**
 * Billing Page — Phase 10
 *
 * Shows current subscription, pricing cards, and FAQ.
 */

"use client";

import { useState, useEffect } from "react";
import PricingCard from "../../../components/parent/PricingCard";
import SubscriptionStatus from "../../../components/parent/SubscriptionStatus";
import { PLAN_CONFIGS, type PlanKey } from "../../../lib/billing/stripe-client";
import { FAQ_ITEMS } from "../../../components/parent/PricingCard";
import type { SubscriptionStatusData } from "../../../components/parent/SubscriptionStatus";
import { useParent } from "@/lib/parent-context";

export default function BillingPage() {
  const { parentId: PARENT_ID } = useParent();
  const [subscription, setSubscription] = useState<SubscriptionStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch(`/api/billing/subscription?userId=${PARENT_ID}`);
      const data = await res.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlanSelect(planKey: string) {
    if (planKey === "SPARK") return; // Can't checkout to free
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: PARENT_ID, planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Stripe checkout is not configured yet. Add STRIPE_SECRET_KEY and price IDs to .env.");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Checkout failed. Check console for details.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleManage() {
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: PARENT_ID }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal failed:", err);
    }
  }

  async function handleStartTrial() {
    try {
      const res = await fetch("/api/billing/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: PARENT_ID }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSubscription();
      } else {
        alert(data.error || "Could not start trial. The demo user may not exist in the database.");
      }
    } catch (err) {
      console.error("Trial start failed:", err);
      alert("Trial start failed. Check console for details.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? "SPARK";
  const showTrialCTA =
    !subscription || (subscription.plan === "SPARK" && !subscription.isTrialing);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Subscription */}
      <SubscriptionStatus
        subscription={subscription}
        onManage={handleManage}
        onUpgrade={() =>
          document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
        }
      />

      {/* Free Trial CTA */}
      {showTrialCTA && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">
                Try Pro free for 14 days 🎉
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                Full access to all features. No credit card required.
              </p>
            </div>
            <button
              onClick={handleStartTrial}
              className="px-6 py-3 bg-white text-purple-700 rounded-xl font-semibold text-sm hover:bg-purple-50 transition-colors"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div id="pricing">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["SPARK", "PRO", "FAMILY", "ANNUAL"] as PlanKey[]).map((key) => (
            <PricingCard
              key={key}
              plan={PLAN_CONFIGS[key]}
              currentPlan={currentPlan}
              isLoading={checkoutLoading}
              onSelect={handlePlanSelect}
            />
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900 text-sm">
                  {faq.question}
                </span>
                <span className="text-gray-400 text-sm">
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
