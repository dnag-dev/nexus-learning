"use client";

/**
 * Parent Sidebar — Phase 9: Parent Dashboard
 *
 * Navigation sidebar with child switcher.
 * Responsive: full sidebar on desktop, hamburger on mobile.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Types ───

export interface ChildSummary {
  id: string;
  displayName: string;
  avatarPersonaId: string;
  gradeLevel: string;
}

interface ParentSidebarProps {
  parentName: string;
  subscriptionPlan: string;
  children: ChildSummary[];
  selectedChildId?: string;
}

// ─── Persona Emoji Map ───

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🐱",
  rex: "🦖",
  nova: "🦊",
  pip: "🦉",
  koda: "🐶",
  zara: "🦋",
  alex: "👦",
  mia: "👧",
  raj: "🧑",
  zoe: "👩",
  jordan: "🧑‍🎓",
  priya: "👩‍🔬",
  marcus: "🧑‍🏫",
  sam: "🧑‍💻",
};

// ─── Plan Badge Colors ───

const PLAN_COLORS: Record<string, string> = {
  SPARK: "bg-gray-100 text-gray-600",
  PRO: "bg-purple-100 text-purple-700",
  FAMILY: "bg-blue-100 text-blue-700",
  ANNUAL: "bg-amber-100 text-amber-700",
};

// ─── Nav Items ───

interface NavItem {
  label: string;
  icon: string;
  href: string;
  requiresChild?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", icon: "📊", href: "/dashboard" },
  {
    label: "Progress",
    icon: "🌟",
    href: "/child/{id}/progress",
    requiresChild: true,
  },
  {
    label: "Sessions",
    icon: "📚",
    href: "/child/{id}/sessions",
    requiresChild: true,
  },
  {
    label: "Reports",
    icon: "📝",
    href: "/child/{id}/reports",
    requiresChild: true,
  },
  { label: "Settings", icon: "⚙️", href: "/settings" },
];

// ─── Component ───

export default function ParentSidebar({
  parentName,
  subscriptionPlan,
  children: childList,
  selectedChildId,
}: ParentSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const resolveHref = (item: NavItem) => {
    if (!item.requiresChild) return item.href;
    const childId = selectedChildId || childList[0]?.id;
    if (!childId) return "#";
    return item.href.replace("{id}", childId);
  };

  const isActive = (item: NavItem) => {
    const href = resolveHref(item);
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const planLabel = subscriptionPlan || "SPARK";
  const planColor = PLAN_COLORS[planLabel] || PLAN_COLORS.SPARK;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        <span className="text-xl">{mobileOpen ? "✕" : "☰"}</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-100
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-lg text-gray-900">Aauti Learn</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{parentName}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColor}`}
              >
                {planLabel}
              </span>
            </div>
          </div>

          {/* Child Switcher */}
          {childList.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                Children
              </p>
              <div className="space-y-1">
                {childList.map((child) => (
                  <Link
                    key={child.id}
                    href={`/child/${child.id}/progress`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedChildId === child.id
                        ? "bg-purple-50 text-purple-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">
                      {PERSONA_EMOJI[child.avatarPersonaId] || "👤"}
                    </span>
                    <span>{child.displayName}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {child.gradeLevel}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const href = resolveHref(item);
                const active = isActive(item);
                const disabled = item.requiresChild && !selectedChildId && childList.length === 0;

                return (
                  <Link
                    key={item.label}
                    href={disabled ? "#" : href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-purple-50 text-purple-700 font-medium"
                        : disabled
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/api/auth/logout"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
