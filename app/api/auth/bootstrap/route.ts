import { NextResponse } from "next/server";
import { bootstrapUserWorkspace, getCurrentAuthUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await bootstrapUserWorkspace(user);
  return NextResponse.json({ workspace });
}
