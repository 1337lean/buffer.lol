import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAuthUser, getCurrentWorkspace, upsertAppUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { teamInvites, teamMembers } from "@/lib/db/schema";

const redeemInviteSchema = z.object({
  code: z.string().trim().min(6).max(64)
});

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email) return NextResponse.json({ error: "Your account needs an email address to redeem an invite." }, { status: 400 });
  const userEmail = user.email;

  await upsertAppUser(user);
  const existingWorkspace = await getCurrentWorkspace(user.id);
  if (existingWorkspace) return NextResponse.json({ error: "You already belong to a team." }, { status: 409 });

  const parsed = redeemInviteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid invite code." }, { status: 400 });

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [invite] = await tx.select().from(teamInvites).where(eq(teamInvites.code, parsed.data.code)).limit(1);
    if (!invite) return { error: "Invite code not found.", status: 404 };
    if (invite.usedAt) return { error: "That invite code has already been used.", status: 409 };
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return { error: "That invite code has expired.", status: 410 };
    }
    if (invite.email && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return { error: "That invite is restricted to another email address.", status: 403 };
    }

    const [redeemed] = await tx
      .update(teamInvites)
      .set({ usedAt: new Date(), usedBy: user.id })
      .where(and(eq(teamInvites.id, invite.id), isNull(teamInvites.usedAt)))
      .returning({ id: teamInvites.id });

    if (!redeemed) return { error: "That invite code has already been used.", status: 409 };

    await tx.insert(teamMembers).values({
      teamId: invite.teamId,
      userId: user.id,
      role: invite.role
    });

    return { ok: true, status: 200 };
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
