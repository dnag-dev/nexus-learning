"use client";

/**
 * Kid Onboarding — 4-screen wizard for new students.
 *
 * Screen 1: Cosmo intro
 * Screen 2: Subject pick (Math / English / Both)
 * Screen 3: Quick diagnostic (8 questions)
 * Screen 4: Celebration + ready to go
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChild } from "@/lib/child-context";
import CosmoIntro from "@/components/kid/onboarding/CosmoIntro";
import SubjectPick from "@/components/kid/onboarding/SubjectPick";
import QuickDiagnostic from "@/components/kid/onboarding/QuickDiagnostic";
import ReadyCelebration from "@/components/kid/onboarding/ReadyCelebration";

export default function OnboardingPage() {
  const router = useRouter();
  const { firstLoginComplete } = useChild();
  const [step, setStep] = useState(0);
  const [subjectFocus, setSubjectFocus] = useState<string | null>(null);

  // If already onboarded, redirect to home
  if (firstLoginComplete) {
    router.replace("/kid");
    return null;
  }

  const handleComplete = () => {
    // Force a full page reload to refresh the child context
    window.location.href = "/kid";
  };

  return (
    <div className="min-h-[80vh]">
      {/* Step indicator dots */}
      <div className="flex justify-center gap-2 py-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === step
                ? "bg-purple-400 w-6"
                : i < step
                  ? "bg-purple-600"
                  : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      {step === 0 && <CosmoIntro onNext={() => setStep(1)} />}
      {step === 1 && (
        <SubjectPick
          value={subjectFocus}
          onChange={setSubjectFocus}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <QuickDiagnostic
          onComplete={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <ReadyCelebration
          subjectFocus={subjectFocus}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
