"use client";

import { FormEvent, useMemo, useState } from "react";

export function TeamOnboardingForm({ suggestedName }: { suggestedName: string }) {
  const [name, setName] = useState(suggestedName);
  const [slug, setSlug] = useState(slugify(suggestedName));
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<"create" | "join" | null>(null);
  const slugPreview = useMemo(() => slugify(slug), [slug]);

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting("create");
    setMessage("Creating team...");

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, slug: slugPreview })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not create team.");
      window.location.assign("/app");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(null);
    }
  }

  async function joinTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting("join");
    setMessage("Redeeming invite...");

    try {
      const response = await fetch("/api/team-invites/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not redeem invite.");
      window.location.assign("/app");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <div className="team-onboarding-grid">
      <form className="product-panel product-form" onSubmit={createTeam}>
        <div>
          <span className="section-kicker">Create team</span>
          <h2>Start a workspace.</h2>
        </div>
        <label>
          <span>Team name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          <span>Team slug</span>
          <input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} required />
        </label>
        <p className="form-privacy">Workspace URL slug: {slugPreview || "team-slug"}</p>
        <button className="submit-btn" type="submit" disabled={isSubmitting !== null}>
          <span>{isSubmitting === "create" ? "Creating..." : "Create team"}</span>
        </button>
      </form>

      <form className="product-panel product-form" onSubmit={joinTeam}>
        <div>
          <span className="section-kicker">Join team</span>
          <h2>Use an invite code.</h2>
        </div>
        <label>
          <span>Invite code</span>
          <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="abc123def456" required />
        </label>
        <button className="submit-btn" type="submit" disabled={isSubmitting !== null}>
          <span>{isSubmitting === "join" ? "Joining..." : "Join team"}</span>
        </button>
        <p className="form-feedback" role="status" aria-live="polite">{message}</p>
      </form>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
