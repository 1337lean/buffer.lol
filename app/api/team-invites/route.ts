import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthUser, getCurrentWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { teamInvites } from "@/lib/db/schema";
import { canManageTeam, inviteRoleSchema } from "@/lib/teams";

const createInviteSchema = z.object({
  email: z.string().trim().email().optional().or(z.literal("")),
  role: inviteRoleSchema.default("member"),
  expiresInDays: z.coerce.number().int().min(1).max(90).optional()
});

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  if (!canManageTeam(workspace.role)) return NextResponse.json({ error: "Only owners and admins can create invites." }, { status: 403 });

  const parsed = createInviteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid invite." }, { status: 400 });
  }

  const expiresAt = parsed.data.expiresInDays ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000) : null;
  const db = getDb();
  const [invite] = await db
    .insert(teamInvites)
    .values({
      teamId: workspace.teamId,
      code: crypto.randomUUID().replaceAll("-", "").slice(0, 12),
      email: parsed.data.email ? parsed.data.email.toLowerCase() : null,
      role: parsed.data.role,
      createdBy: user.id,
      expiresAt
    })
    .returning();

  return NextResponse.json({ invite }, { status: 201 });
}
