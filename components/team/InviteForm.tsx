"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function InviteForm({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Creating invite...");

    try {
      const response = await fetch("/api/team-invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role, expiresInDays })
      });
      const data = (await response.json()) as { error?: string; invite?: { code: string } };
      if (!response.ok) throw new Error(data.error || "Could not create invite.");
      setEmail("");
      setMessage(`Invite code: ${data.invite?.code}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="product-form invite-form" onSubmit={onSubmit}>
      <label>
        <span>Email restriction</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="optional@company.com" disabled={!canCreate} />
      </label>
      <div className="form-row">
        <label>
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as "member" | "admin")} disabled={!canCreate}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          <span>Expires</span>
          <select value={expiresInDays} onChange={(event) => setExpiresInDays(event.target.value)} disabled={!canCreate}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </label>
      </div>
      {canCreate ? (
        <button className="submit-btn product-primary" type="submit" disabled={isSubmitting}>
          <span>{isSubmitting ? "Creating..." : "Create invite"}</span>
        </button>
      ) : null}
      <p className="form-feedback" role="status" aria-live="polite">{canCreate ? message : "Only owners and admins can create invites."}</p>
    </form>
  );
}
