import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { getDb } from "@/lib/db/client";
import { teamMembers, teams, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
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
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/signup?setup=required");
  return { user, workspace };
}

export async function requireAdminUser() {
  const user = await requireAuthUser();
  if (!isAdminEmail(user.email || "")) redirect("/app");
  return user;
}

export async function bootstrapUserWorkspace(authUser: User) {
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

  const existing = await getCurrentWorkspace(authUser.id);
  if (existing) return existing;

  const baseName = inferTeamName(email, displayName);
  const teamSlug = await uniqueTeamSlug(baseName);
  const [team] = await db
    .insert(teams)
    .values({
      name: baseName,
      slug: teamSlug
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: authUser.id,
    role: "owner"
  });

  return {
    teamId: team.id,
    role: "owner" as const,
    teamName: team.name,
    teamSlug: team.slug
  };
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

function inferTeamName(email: string, displayName: string | null) {
  const domain = email.split("@")[1]?.split(".")[0];
  if (domain) return titleCase(domain);
  if (displayName) return `${displayName}'s team`;
  return "buffer.lol team";
}

async function uniqueTeamSlug(name: string) {
  const db = getDb();
  const base = slugify(name) || "team";
  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const [existing] = await db.select({ id: teams.id }).from(teams).where(eq(teams.slug, slug)).limit(1);
    if (!existing) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function slugify(value: string) {
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

function isAdminEmail(email: string) {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.toLowerCase());
}
