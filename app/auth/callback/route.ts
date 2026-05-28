import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { bootstrapUserWorkspace, getCurrentAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const user = await getCurrentAuthUser();
    if (user) await bootstrapUserWorkspace(user);
  }

  redirect(next);
}

function safeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/app";

  try {
    const parsed = new URL(value, "https://buffer.lol");
    return parsed.origin === "https://buffer.lol" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/app";
  } catch {
    return "/app";
  }
}
