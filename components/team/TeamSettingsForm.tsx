"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type TeamSettingsFormProps = {
  name: string;
  slug: string;
  canEdit: boolean;
};

export function TeamSettingsForm({ name, slug, canEdit }: TeamSettingsFormProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState(name);
  const [teamSlug, setTeamSlug] = useState(slug);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Saving team settings...");

    try {
      const response = await fetch("/api/teams/current", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: teamName, slug: teamSlug })
      });
      const data = (await response.json()) as { error?: string; team?: { name: string; slug: string } };
      if (!response.ok) throw new Error(data.error || "Could not update team settings.");
      if (data.team) {
        setTeamName(data.team.name);
        setTeamSlug(data.team.slug);
      }
      setMessage("Team settings updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="product-form" onSubmit={onSubmit}>
      <label>
        <span>Team name</span>
        <input value={teamName} onChange={(event) => setTeamName(event.target.value)} disabled={!canEdit} required />
      </label>
      <label>
        <span>Team slug</span>
        <input value={teamSlug} onChange={(event) => setTeamSlug(slugify(event.target.value))} disabled={!canEdit} required />
      </label>
      {canEdit ? (
        <button className="submit-btn product-primary" type="submit" disabled={isSubmitting}>
          <span>{isSubmitting ? "Saving..." : "Save settings"}</span>
        </button>
      ) : null}
      <p className="form-feedback" role="status" aria-live="polite">{canEdit ? message : "Only owners and admins can edit team settings."}</p>
    </form>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
