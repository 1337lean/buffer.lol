import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { bootstrapUserWorkspace, getCurrentAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/app";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const user = await getCurrentAuthUser();
    if (user) await bootstrapUserWorkspace(user);
  }

  redirect(next);
}
