import { redirect } from "next/navigation";
import { TeamOnboardingForm } from "@/components/team/TeamOnboardingForm";
import { getCurrentWorkspace, inferTeamName, requireAuthUser, upsertAppUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeamOnboardingPage() {
  const user = await requireAuthUser();
  await upsertAppUser(user);
  const workspace = await getCurrentWorkspace(user.id);
  if (workspace) redirect("/app");

  const metadataName = user.user_metadata?.name;
  const displayName = typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : null;
  const suggestedName = inferTeamName(user.email || "", displayName);

  return (
    <main className="product-main" id="main-content">
      <section className="product-title-row">
        <div>
          <span className="section-kicker">Team onboarding</span>
          <h1>Set up your team.</h1>
          <p>Create a workspace for your media diagnostics or join an existing team with an invite code.</p>
        </div>
      </section>
      <TeamOnboardingForm suggestedName={suggestedName} />
    </main>
  );
}
