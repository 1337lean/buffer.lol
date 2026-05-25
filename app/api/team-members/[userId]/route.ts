import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAuthUser, getCurrentWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { teamMembers } from "@/lib/db/schema";
import { canManageTeam, memberRoleSchema, ownerCount } from "@/lib/teams";

type Params = {
  params: Promise<{ userId: string }>;
};

const updateMemberSchema = z.object({
  role: memberRoleSchema
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  if (!canManageTeam(workspace.role)) return NextResponse.json({ error: "Only owners and admins can manage roles." }, { status: 403 });

  const parsed = updateMemberSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid role." }, { status: 400 });

  const { userId } = await params;
  const db = getDb();
  const [member] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, workspace.teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!member) return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  if (workspace.role !== "owner" && (member.role === "owner" || parsed.data.role === "owner")) {
    return NextResponse.json({ error: "Only owners can change owner roles." }, { status: 403 });
  }

  const demotingOwner = member.role === "owner" && parsed.data.role !== "owner";
  if (demotingOwner && (await ownerCount(workspace.teamId)) <= 1) {
    return NextResponse.json({ error: "A team must always have at least one owner." }, { status: 409 });
  }

  const [updated] = await db
    .update(teamMembers)
    .set({ role: parsed.data.role })
    .where(and(eq(teamMembers.teamId, workspace.teamId), eq(teamMembers.userId, userId)))
    .returning();

  return NextResponse.json({ member: updated });
}
