import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { waitlistEntries } from "@/lib/db/schema";

type Params = {
  params: Promise<{ id: string }>;
};

const schema = z.object({
  status: z.enum(["new", "contacted", "invited", "converted"])
});

export async function PATCH(request: NextRequest, { params }: Params) {
  await requireAdminUser();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const { id } = await params;
  const db = getDb();
  const [entry] = await db
    .update(waitlistEntries)
    .set({ status: parsed.data.status })
    .where(eq(waitlistEntries.id, id))
    .returning();

  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  return NextResponse.json({ entry });
}
