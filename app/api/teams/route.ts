import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthUser, getCurrentWorkspace, upsertAppUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { teamMembers, teams } from "@/lib/db/schema";
import { slugIsAvailable, teamNameSchema, teamSlugSchema } from "@/lib/teams";

const createTeamSchema = z.object({
  name: teamNameSchema,
  slug: teamSlugSchema
});

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await upsertAppUser(user);
  const existingWorkspace = await getCurrentWorkspace(user.id);
  if (existingWorkspace) {
    return NextResponse.json({ error: "You already belong to a team." }, { status: 409 });
  }

  const parsed = createTeamSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid team settings." }, { status: 400 });
  }

  const { name, slug } = parsed.data;
  if (!(await slugIsAvailable(slug))) {
    return NextResponse.json({ error: "That team slug is already taken." }, { status: 409 });
  }

  const db = getDb();
  const [team] = await db.insert(teams).values({ name, slug }).returning();
  await db.insert(teamMembers).values({ teamId: team.id, userId: user.id, role: "owner" });

  return NextResponse.json({ team }, { status: 201 });
}
