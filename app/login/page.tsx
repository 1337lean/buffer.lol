import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { SiteChrome } from "@/components/landing/SiteChrome";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to buffer.lol."
};

export default function LoginPage() {
  return (
    <SiteChrome cta={<Link className="header-cta" href="/signup">Create account</Link>} navHomePrefix="/">
      <main className="simple-main auth-main" id="main-content">
        <article className="simple-page auth-card">
          <span className="section-kicker">Workspace access</span>
          <h1>Sign in.</h1>
          <p>Return to your media diagnostics workspace.</p>
          <AuthForm mode="login" />
          <p>New to buffer.lol? <Link href="/signup">Create an account</Link>.</p>
        </article>
      </main>
    </SiteChrome>
  );
}
