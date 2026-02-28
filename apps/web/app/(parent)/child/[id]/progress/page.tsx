"use client";

/**
 * Redirect: /child/[id]/progress → /dashboard/child/[id]?tab=progress
 */

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProgressRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/child/${params.id}?tab=progress`);
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-gray-400 animate-pulse">Redirecting...</p>
    </div>
  );
}
