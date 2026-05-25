"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(isSignup ? "Creating your workspace..." : "Signing in...");

    try {
      const supabase = createSupabaseBrowserClient();
      const response = isSignup
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          })
        : await supabase.auth.signInWithPassword({ email, password });

      if (response.error) throw response.error;

      if (!response.data.session) {
        setMessage("Check your email to confirm access, then return to sign in.");
        return;
      }

      const bootstrapResponse = await fetch("/api/auth/bootstrap", { method: "POST" });
      if (!bootstrapResponse.ok) throw new Error("Could not prepare your workspace.");
      window.location.assign("/app");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {isSignup ? (
        <label>
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" autoComplete="name" />
        </label>
      ) : null}
      <label>
        <span>Email</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required />
      </label>
      <label>
        <span>Password</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={isSignup ? "new-password" : "current-password"} required />
      </label>
      <button className="submit-btn" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Working..." : isSignup ? "Create account" : "Sign in"}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </button>
      <p className="form-feedback" role="status" aria-live="polite">{message}</p>
    </form>
  );
}
