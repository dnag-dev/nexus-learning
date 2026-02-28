"use client";

/**
 * Redirect: /child/[id]/sessions → /dashboard/child/[id]?tab=sessions
 */

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SessionsRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/child/${params.id}?tab=sessions`);
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-gray-400 animate-pulse">Redirecting...</p>
    </div>
  );
}
