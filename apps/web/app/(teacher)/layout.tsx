"use client";

/**
 * Teacher Layout — Phase 11: Teacher Dashboard
 *
 * Shared layout with sidebar navigation for all teacher routes.
 * Syncs Auth0 session -> DB user, provides teacher context.
 * Mirrors parent layout pattern exactly.
 */

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter, usePathname } from "next/navigation";
import TeacherSidebar, {
  type ClassSummary,
} from "@/components/teacher/TeacherSidebar";
import { TeacherContext } from "@/lib/teacher-context";

interface TeacherProfile {
  teacherId: string;
  userId: string;
  email: string;
  name: string;
  schoolName: string | null;
}

interface TeacherData {
  classes: ClassSummary[];
  stats: {
    totalStudents: number;
    activeAlerts: number;
    activeAssignments: number;
  };
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract class ID from URL
  const classIdMatch = pathname.match(/\/class\/([^/]+)/);
  const selectedClassId = classIdMatch ? classIdMatch[1] : undefined;

  // Step 1: Sync Auth0 user -> DB user, check teacher role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

    fetch("/api/auth/sync")
      .then((res) => {
        if (!res.ok) throw new Error("Sync failed");
        return res.json();
      })
      .then((data) => {
        if (data.role !== "TEACHER") {
          // Not a teacher, redirect to parent dashboard
          router.push("/dashboard");
          return;
        }

        setProfile({
          teacherId: data.teacherProfileId,
          userId: data.id,
          email: data.email,
          name: data.name,
          schoolName: data.schoolName ?? null,
        });
      })
      .catch((err) => {
        console.error("Auth sync failed:", err);
      });
  }, [user, authLoading, router]);

  // Step 2: Fetch teacher data once we have the profile
  const fetchData = useCallback(async () => {
    if (!profile) return;

    try {
      const res = await fetch(
        `/api/teacher/${profile.teacherId}/overview`
      );

      if (res.ok) {
        const data = await res.json();
        setTeacherData({
          classes: data.classes || [],
          stats: data.stats || {
            totalStudents: 0,
            activeAlerts: 0,
            activeAssignments: 0,
          },
        });
      }
    } catch (err) {
      console.error("Failed to load teacher data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  // Loading states
  if (authLoading || (!profile && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Signing you in...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to login
  }

  if (loading && !teacherData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">
          Loading teacher dashboard...
        </div>
      </div>
    );
  }

  return (
    <TeacherContext.Provider
      value={{
        teacherId: profile?.teacherId ?? "",
        userId: profile?.userId ?? "",
        email: profile?.email ?? "",
        name: profile?.name ?? "",
        schoolName: profile?.schoolName ?? null,
      }}
    >
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <TeacherSidebar
          teacherName={profile?.name || "Teacher"}
          schoolName={profile?.schoolName ?? null}
          classes={teacherData?.classes || []}
          selectedClassId={selectedClassId}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div className="lg:hidden w-10" />
            <h1 className="text-lg font-semibold text-gray-900 hidden lg:block">
              Teacher Dashboard
            </h1>
            <div className="flex items-center gap-3">
              {teacherData && teacherData.stats.activeAlerts > 0 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                  {teacherData.stats.activeAlerts} alert
                  {teacherData.stats.activeAlerts !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-sm text-gray-500 hidden md:block">
                {profile?.name}
              </span>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6 max-w-6xl mx-auto">{children}</main>
        </div>
      </div>
    </TeacherContext.Provider>
  );
}
