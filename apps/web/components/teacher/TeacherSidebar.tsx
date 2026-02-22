"use client";

/**
 * Teacher Sidebar — Phase 11: Teacher Dashboard
 *
 * Navigation sidebar with class switcher.
 * Mirrors ParentSidebar pattern.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Types ───

export interface ClassSummary {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
}

interface TeacherSidebarProps {
  teacherName: string;
  schoolName: string | null;
  classes: ClassSummary[];
  selectedClassId?: string;
}

// ─── Nav Items ───

interface NavItem {
  label: string;
  icon: string;
  href: string;
  requiresClass?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", icon: "📊", href: "/teacher-dashboard" },
  {
    label: "Class",
    icon: "👨‍🏫",
    href: "/teacher-dashboard/class/{id}",
    requiresClass: true,
  },
  { label: "Assignments", icon: "📋", href: "/teacher-dashboard/assignments" },
  { label: "Alerts", icon: "🔔", href: "/teacher-dashboard/alerts" },
  { label: "Lesson Plan", icon: "📝", href: "/teacher-dashboard/lesson-plan" },
];

// ─── Component ───

export default function TeacherSidebar({
  teacherName,
  schoolName,
  classes: classList,
  selectedClassId,
}: TeacherSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const resolveHref = (item: NavItem) => {
    if (!item.requiresClass) return item.href;
    const classId = selectedClassId || classList[0]?.id;
    if (!classId) return "#";
    return item.href.replace("{id}", classId);
  };

  const isActive = (item: NavItem) => {
    const href = resolveHref(item);
    if (href === "#") return false;
    if (item.label === "Overview") {
      return pathname === "/teacher-dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        <span className="text-xl">{mobileOpen ? "\u2715" : "\u2630"}</span>
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
              <span className="text-sm text-gray-500">{teacherName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                Teacher
              </span>
            </div>
            {schoolName && (
              <p className="text-xs text-gray-400 mt-0.5">{schoolName}</p>
            )}
          </div>

          {/* Class Switcher */}
          {classList.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                Classes
              </p>
              <div className="space-y-1">
                {classList.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/teacher-dashboard/class/${cls.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedClassId === cls.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">🏫</span>
                    <span className="truncate">{cls.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {cls.studentCount}
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
                const disabled =
                  item.requiresClass && !selectedClassId && classList.length === 0;

                return (
                  <Link
                    key={item.label}
                    href={disabled ? "#" : href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700 font-medium"
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
