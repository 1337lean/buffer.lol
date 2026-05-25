import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAuthUser, getCurrentWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { teams } from "@/lib/db/schema";
import { canManageTeam, slugIsAvailable, teamNameSchema, teamSlugSchema } from "@/lib/teams";

const updateTeamSchema = z.object({
  name: teamNameSchema,
  slug: teamSlugSchema
});

export async function PATCH(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  if (!canManageTeam(workspace.role)) return NextResponse.json({ error: "Only owners and admins can update team settings." }, { status: 403 });

  const parsed = updateTeamSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid team settings." }, { status: 400 });
  }

  const { name, slug } = parsed.data;
  if (!(await slugIsAvailable(slug, workspace.teamId))) {
    return NextResponse.json({ error: "That team slug is already taken." }, { status: 409 });
  }

  const db = getDb();
  const [team] = await db.update(teams).set({ name, slug }).where(eq(teams.id, workspace.teamId)).returning();

  return NextResponse.json({ team });
}
