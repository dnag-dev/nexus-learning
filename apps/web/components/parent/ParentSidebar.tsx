"use client";

/**
 * Parent Sidebar — Phase 9: Parent Dashboard (UX Overhaul)
 *
 * Three responsive modes:
 *   Desktop (≥1025px): Traditional left sidebar (w-64, static)
 *   Tablet  (769–1024px): Horizontal tab bar below header
 *   Mobile  (≤768px): Hamburger menu overlay
 *
 * Sidebar never disappears on zoom — converts modes instead.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";

// ─── Types ───

export interface ChildSummary {
  id: string;
  displayName: string;
  avatarPersonaId: string;
  gradeLevel: string;
  lastActiveAt?: string | null;
}

interface ParentSidebarProps {
  parentName: string;
  parentEmail?: string;
  subscriptionPlan: string;
  children: ChildSummary[];
  selectedChildId?: string;
  onAddChild?: () => void;
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

// ─── Nav Items (simplified: only 3 main items) ───

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "🏠", href: "/dashboard" },
  { label: "GPS", icon: "🧭", href: "/gps" },
  { label: "Reports", icon: "📊", href: "/reports" },
  { label: "Settings", icon: "⚙️", href: "/settings" },
];

// ─── Helpers ───

/** Returns true if child was active within the last 24 hours. */
function isActiveToday(lastActiveAt?: string | null): boolean {
  if (!lastActiveAt) return false;
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  return diff < 24 * 60 * 60 * 1000;
}

// ─── Component ───

export default function ParentSidebar({
  parentName,
  parentEmail,
  subscriptionPlan,
  children: childList,
  selectedChildId,
  onAddChild,
}: ParentSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const breakpoint = useBreakpoint();

  const planLabel = subscriptionPlan || "SPARK";
  const planColor = PLAN_COLORS[planLabel] || PLAN_COLORS.SPARK;

  // Build dynamic GPS href using selected or first child
  const gpsStudentId = selectedChildId || childList[0]?.id;
  const gpsHref = gpsStudentId ? `/gps?studentId=${gpsStudentId}` : "/gps";

  const getNavHref = (item: NavItem) => {
    if (item.label === "GPS") return gpsHref;
    return item.href;
  };

  const isNavActive = (item: NavItem) => {
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  // ─── TABLET MODE: Horizontal tab bar ───
  if (breakpoint === "tablet") {
    return (
      <nav className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-[1100px] mx-auto flex items-center gap-1 overflow-x-auto">
          {/* Nav items */}
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={getNavHref(item)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                isNavActive(item)
                  ? "bg-purple-50 text-purple-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />

          {/* Children chips */}
          {childList.map((child) => {
            const active = isActiveToday(child.lastActiveAt);
            const isSelected =
              selectedChildId === child.id ||
              pathname.includes(`/child/${child.id}`);
            return (
              <Link
                key={child.id}
                href={`/dashboard/child/${child.id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-purple-50 text-purple-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    active ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span>{child.displayName}</span>
              </Link>
            );
          })}

          {/* Add Child */}
          {onAddChild && (
            <button
              onClick={onAddChild}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-full whitespace-nowrap transition-colors"
            >
              + Add
            </button>
          )}
        </div>
      </nav>
    );
  }

  // ─── MOBILE MODE: Hamburger ───
  if (breakpoint === "mobile") {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
          aria-label="Toggle menu"
        >
          <span className="text-xl">{mobileOpen ? "✕" : "☰"}</span>
        </button>

        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Slide-out sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40
            w-64 bg-white border-r border-gray-100
            transform transition-transform duration-200 ease-in-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <SidebarContent
            parentName={parentName}
            parentEmail={parentEmail}
            planLabel={planLabel}
            planColor={planColor}
            childList={childList}
            selectedChildId={selectedChildId}
            pathname={pathname}
            onAddChild={onAddChild}
            onNavigate={() => setMobileOpen(false)}
            getNavHref={getNavHref}
          />
        </aside>
      </>
    );
  }

  // ─── DESKTOP MODE: Static sidebar (default + SSR fallback) ───
  return (
    <aside className="hidden lg:block w-60 min-w-[240px] bg-white border-r border-gray-100 flex-shrink-0">
      <SidebarContent
        parentName={parentName}
        parentEmail={parentEmail}
        planLabel={planLabel}
        planColor={planColor}
        childList={childList}
        selectedChildId={selectedChildId}
        pathname={pathname}
        onAddChild={onAddChild}
        onNavigate={() => {}}
        getNavHref={getNavHref}
      />
    </aside>
  );
}

// ─── Sidebar Content (shared between desktop and mobile) ───

function SidebarContent({
  parentName,
  parentEmail,
  planLabel,
  planColor,
  childList,
  selectedChildId,
  pathname,
  onAddChild,
  onNavigate,
  getNavHref,
}: {
  parentName: string;
  parentEmail?: string;
  planLabel: string;
  planColor: string;
  childList: ChildSummary[];
  selectedChildId?: string;
  pathname: string;
  onAddChild?: () => void;
  onNavigate: () => void;
  getNavHref: (item: NavItem) => string;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo + Identity */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg text-gray-900">Aauti Learn</h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColor}`}
          >
            {planLabel}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1 truncate">
          {parentEmail || parentName}
        </p>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.label}
                href={getNavHref(item)}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-purple-50 text-purple-700 font-medium"
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

      {/* Children Section */}
      <div className="px-4 flex-1">
        <div className="border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
            My Children
          </p>
          <div className="space-y-1">
            {childList.map((child) => {
              const active = isActiveToday(child.lastActiveAt);
              const isSelected =
                selectedChildId === child.id ||
                pathname.includes(`/child/${child.id}`);

              return (
                <Link
                  key={child.id}
                  href={`/dashboard/child/${child.id}`}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "bg-purple-50 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      active ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span className="text-lg">
                    {PERSONA_EMOJI[child.avatarPersonaId] || "👤"}
                  </span>
                  <span className="truncate">{child.displayName}</span>
                </Link>
              );
            })}
          </div>

          {/* Add Child Button */}
          {onAddChild && (
            <button
              onClick={() => {
                onAddChild();
                onNavigate();
              }}
              className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors w-full"
            >
              <span>+</span>
              <span>Add Child</span>
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Nudge — only for SPARK plan */}
      {planLabel === "SPARK" && (
        <div className="px-4 pb-2">
          <Link
            href="/pricing"
            onClick={onNavigate}
            className="block p-3 bg-purple-50 border border-purple-100 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <p className="text-xs font-semibold text-purple-700">
              ⭐ Spark Plan
            </p>
            <p className="text-[11px] text-purple-600 mt-0.5 leading-snug">
              Upgrade for unlimited children &amp; features
            </p>
            <span className="inline-block mt-1.5 text-xs font-medium text-purple-700">
              Upgrade →
            </span>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link
          href="#"
          onClick={onNavigate}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span>❓</span>
          <span>Help</span>
        </Link>
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </Link>
      </div>
    </div>
  );
}
