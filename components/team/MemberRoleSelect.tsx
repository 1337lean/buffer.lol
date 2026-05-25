"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "owner" | "admin" | "member";

export function MemberRoleSelect({
  userId,
  role,
  canEdit
}: {
  userId: string;
  role: Role;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>(role);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateRole(nextRole: Role) {
    setSelectedRole(nextRole);
    setIsSubmitting(true);
    setMessage("Saving...");

    try {
      const response = await fetch(`/api/team-members/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: nextRole })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not update role.");
      setMessage("Saved.");
      router.refresh();
    } catch (error) {
      setSelectedRole(role);
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <label className="inline-control">
      <span className="sr-only">Role</span>
      <select value={selectedRole} onChange={(event) => updateRole(event.target.value as Role)} disabled={!canEdit || isSubmitting}>
        <option value="owner">Owner</option>
        <option value="admin">Admin</option>
        <option value="member">Member</option>
      </select>
      <small>{message}</small>
    </label>
  );
}
