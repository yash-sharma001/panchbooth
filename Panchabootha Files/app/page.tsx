import { Suspense } from "react";
import { cookies } from "next/headers";
import { sessionUser, SESSION_COOKIE } from "@/lib/auth.js";
import { AppShell } from "@/components/AppShell";
import type { SessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default function Page() {
  const user = (sessionUser(cookies().get(SESSION_COOKIE)?.value) ?? null) as SessionUser | null;
  return (
    <Suspense fallback={<div className="grid h-screen place-items-center text-ink-dim">Loading&hellip;</div>}>
      <AppShell initialUser={user} />
    </Suspense>
  );
}
