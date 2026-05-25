import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { SiteChrome } from "@/components/landing/SiteChrome";

export const metadata: Metadata = {
  title: "Signup",
  description: "Create a buffer.lol workspace."
};

export default function SignupPage() {
  return (
    <SiteChrome cta={<Link className="header-cta" href="/login">Sign in</Link>} navHomePrefix="/">
      <main className="simple-main auth-main" id="main-content">
        <article className="simple-page auth-card">
          <span className="section-kicker">Workspace</span>
          <h1>Create account.</h1>
          <p>Create your account, then make or join a team workspace to start queuing URL probes.</p>
          <AuthForm mode="signup" />
          <p>Already have access? <Link href="/login">Sign in</Link>.</p>
        </article>
      </main>
    </SiteChrome>
  );
}
