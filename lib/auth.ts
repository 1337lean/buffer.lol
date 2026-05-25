import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { getDb } from "@/lib/db/client";
import { teamMembers, teams, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/async-timeout";

export async function getCurrentAuthUser() {
  if (!(await hasSupabaseAuthCookie())) return null;

  const supabase = await createSupabaseServerClient();
  let result: Awaited<ReturnType<typeof supabase.auth.getUser>>;
  try {
    result = await withTimeout(supabase.auth.getUser(), 2500, "Auth validation timed out.");
  } catch {
    return null;
  }

  const { data, error } = result;
  if (error || !data.user) return null;
  return data.user;
}

export async function requireAuthUser() {
  const user = await getCurrentAuthUser();
  if (!user) redirect("/login");
  return user;
}

export async function getCurrentWorkspace(userId: string) {
  const db = getDb();
  const [membership] = await db
    .select({
      teamId: teamMembers.teamId,
      role: teamMembers.role,
      teamName: teams.name,
      teamSlug: teams.slug
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .limit(1);

  return membership ?? null;
}

export async function requireWorkspace() {
  const user = await requireAuthUser();
  await upsertAppUser(user);
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/onboarding/team");
  return { user, workspace };
}

export async function requireAdminUser() {
  const user = await requireAuthUser();
  if (!isAdminEmail(user.email || "")) redirect("/app");
  return user;
}

export async function bootstrapUserWorkspace(authUser: User) {
  await upsertAppUser(authUser);
  return getCurrentWorkspace(authUser.id);
}

export async function upsertAppUser(authUser: User) {
  const db = getDb();
  const email = authUser.email;
  if (!email) throw new Error("Authenticated user is missing an email address.");

  const displayName = getDisplayName(authUser);
  await db
    .insert(users)
    .values({
      id: authUser.id,
      email,
      name: displayName
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        name: displayName
      }
    });
}

export async function verifyTeamAccess(userId: string, teamId: string) {
  const db = getDb();
  const [membership] = await db
    .select({ teamId: teamMembers.teamId, role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1);

  return membership ?? null;
}

function getDisplayName(authUser: User) {
  const metadataName = authUser.user_metadata?.name;
  return typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : null;
}

export function inferTeamName(email: string, displayName: string | null) {
  const genericProviders = new Set([
    "aol.com",
    "gmail.com",
    "googlemail.com",
    "hotmail.com",
    "icloud.com",
    "live.com",
    "mac.com",
    "me.com",
    "msn.com",
    "outlook.com",
    "proton.me",
    "protonmail.com",
    "yahoo.com"
  ]);
  const fullDomain = email.split("@")[1]?.toLowerCase();
  if (fullDomain && genericProviders.has(fullDomain)) {
    return displayName ? `${displayName}'s workspace` : "Personal workspace";
  }
  const domain = email.split("@")[1]?.split(".")[0];
  if (domain) return titleCase(domain);
  if (displayName) return `${displayName}'s team`;
  return "buffer.lol team";
}

export async function uniqueTeamSlug(name: string) {
  const db = getDb();
  const base = slugify(name) || "team";
  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const [existing] = await db.select({ id: teams.id }).from(teams).where(eq(teams.slug, slug)).limit(1);
    if (!existing) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value: string) {
  return value.replace(/(^|-)([a-z])/g, (_match, separator: string, letter: string) => {
    return `${separator ? " " : ""}${letter.toUpperCase()}`;
  });
}

async function hasSupabaseAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.getAll().some((cookie) => {
    return cookie.name.includes("auth-token") || cookie.name.startsWith("sb-");
  });
}

export function isAdminEmail(email: string) {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.toLowerCase());
}
