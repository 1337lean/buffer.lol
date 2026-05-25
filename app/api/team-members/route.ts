import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentAuthUser, getCurrentWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { teamMembers, users } from "@/lib/db/schema";

export async function GET() {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const db = getDb();
  const members = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      role: teamMembers.role,
      joinedAt: teamMembers.createdAt
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, workspace.teamId))
    .orderBy(asc(teamMembers.createdAt));

  return NextResponse.json({ members });
}
