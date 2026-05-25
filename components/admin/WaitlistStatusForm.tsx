"use client";

import { useState } from "react";

const statuses = ["new", "contacted", "invited", "converted"] as const;

export function WaitlistStatusForm({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: string) {
    setValue(nextStatus);
    setMessage("Saving...");
    const response = await fetch(`/api/admin/waitlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setMessage(response.ok ? "Saved" : "Failed");
  }

  return (
    <label className="admin-status-control">
      <span className="sr-only">Waitlist status</span>
      <select value={value} onChange={(event) => updateStatus(event.target.value)}>
        {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <small>{message}</small>
    </label>
  );
}
