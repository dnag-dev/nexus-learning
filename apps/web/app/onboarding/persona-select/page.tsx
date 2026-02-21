"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { PersonaConfig, AgeGroupValue } from "@/lib/personas/persona-config";

/**
 * Persona Selection Page — Onboarding step where students choose their AI tutor
 *
 * - Shows a grid of 5 personas for the student's age group
 * - Each card: large avatar emoji, name, catchphrase, theme badge
 * - Hover: shows personality preview
 * - Selection: animated checkmark, saves to Student.avatarPersonaId
 */

interface StudentInfo {
  id: string;
  displayName: string;
  ageGroup: AgeGroupValue;
  avatarPersonaId: string;
}

export default function PersonaSelectPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white flex items-center justify-center">
        <div className="animate-pulse text-4xl">✨</div>
      </div>
    }>
      <PersonaSelectPage />
    </Suspense>
  );
}

function PersonaSelectPage() {
  const searchParams = useSearchParams();
  const DEMO_STUDENT_ID = searchParams.get("studentId") || "demo-student-1";
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [personas, setPersonas] = useState<PersonaConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch student info from API to get real age group + persona
    async function load() {
      try {
        const mod = await import("@/lib/personas/persona-config");

        // Try to load real student data from the API
        const res = await fetch(`/api/student/${DEMO_STUDENT_ID}/gamification`);
        if (res.ok) {
          const data = await res.json();
          const studentInfo: StudentInfo = {
            id: DEMO_STUDENT_ID,
            displayName: data.studentName || "Student",
            ageGroup: data.ageGroup || "EARLY_5_7",
            avatarPersonaId: data.persona || "cosmo",
          };
          setStudent(studentInfo);
          setSelectedId(studentInfo.avatarPersonaId);
          setPersonas(mod.getPersonasForAgeGroup(studentInfo.ageGroup));
        } else {
          // Fallback to demo student
          const demoStudent: StudentInfo = {
            id: DEMO_STUDENT_ID,
            displayName: "Student",
            ageGroup: "EARLY_5_7",
            avatarPersonaId: "cosmo",
          };
          setStudent(demoStudent);
          setSelectedId(demoStudent.avatarPersonaId);
          setPersonas(mod.getPersonasForAgeGroup(demoStudent.ageGroup));
        }
      } catch {
        setError("Failed to load personas");
      }
    }
    load();
  }, [DEMO_STUDENT_ID]);

  const selectPersona = useCallback(
    async (personaId: string) => {
      if (!student) return;
      setSelectedId(personaId);
      setIsSaving(true);
      setSaved(false);
      setError(null);

      try {
        const res = await fetch(`/api/student/${student.id}/persona`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to save persona");
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [student]
  );

  if (!student || personas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">✨</div>
          <p className="text-aauti-text-secondary">Loading your tutors...</p>
        </div>
      </div>
    );
  }

  const ageGroupLabel: Record<AgeGroupValue, string> = {
    EARLY_5_7: "Ages 5-7",
    MID_8_10: "Ages 8-10",
    UPPER_11_12: "Ages 11-12",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-aauti-text-primary mb-2">
            Choose Your Tutor!
          </h1>
          <p className="text-aauti-text-secondary text-lg">
            Pick the character who&apos;ll help you learn math.{" "}
            <span className="text-sm text-aauti-text-muted">
              ({ageGroupLabel[student.ageGroup]})
            </span>
          </p>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {personas.map((persona) => {
            const isSelected = selectedId === persona.id;
            const isHovered = hoveredId === persona.id;

            return (
              <button
                key={persona.id}
                onClick={() => selectPersona(persona.id)}
                onMouseEnter={() => setHoveredId(persona.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={isSaving}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-aauti-primary bg-aauti-primary/5 shadow-lg scale-[1.02]"
                    : "border-gray-200 bg-white hover:border-aauti-primary/50 hover:shadow-md"
                } disabled:opacity-70`}
              >
                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 bg-aauti-primary rounded-full flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Avatar Emoji */}
                <div className="text-center mb-4">
                  <span
                    className={`text-6xl inline-block transition-transform duration-200 ${
                      isHovered || isSelected ? "scale-110" : ""
                    }`}
                  >
                    {persona.avatarPlaceholder}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-aauti-text-primary text-center mb-1">
                  {persona.name}
                </h3>

                {/* Catchphrase */}
                <p className="text-sm text-aauti-text-secondary text-center italic mb-3">
                  &ldquo;{persona.catchphrase}&rdquo;
                </p>

                {/* Theme Badge */}
                <div className="flex justify-center">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full capitalize">
                    {persona.theme}
                  </span>
                </div>

                {/* Personality Preview (on hover) */}
                {isHovered && (
                  <div className="mt-4 pt-3 border-t border-gray-100 animate-[fade-in_0.2s_ease-out]">
                    <p className="text-xs text-aauti-text-muted leading-relaxed">
                      {persona.personality}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Status */}
        <div className="text-center">
          {saved && (
            <p className="text-aauti-success font-medium animate-[fade-in_0.3s_ease-out]">
              ✅ Persona saved!
            </p>
          )}
          {error && <p className="text-aauti-danger text-sm">{error}</p>}
        </div>

        {/* Continue Button */}
        <div className="text-center mt-6">
          <a
            href={`/session?studentId=${DEMO_STUDENT_ID}`}
            className="inline-block px-8 py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors"
          >
            Start Learning! 🚀
          </a>
        </div>
      </div>
    </div>
  );
}
