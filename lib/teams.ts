import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { teamMembers, teams } from "@/lib/db/schema";

export const teamNameSchema = z.string().trim().min(2).max(80);
export const teamSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens.");

export const memberRoleSchema = z.enum(["owner", "admin", "member"]);
export const inviteRoleSchema = z.enum(["admin", "member"]);

export type MemberRole = z.infer<typeof memberRoleSchema>;

export function canManageTeam(role: string) {
  return role === "owner" || role === "admin";
}

export async function slugIsAvailable(slug: string, currentTeamId?: string) {
  const db = getDb();
  const where = currentTeamId ? and(eq(teams.slug, slug), ne(teams.id, currentTeamId)) : eq(teams.slug, slug);
  const [existing] = await db.select({ id: teams.id }).from(teams).where(where).limit(1);
  return !existing;
}

export async function ownerCount(teamId: string) {
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, "owner")));

  return row.value;
}

