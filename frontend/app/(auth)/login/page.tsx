"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { setSession } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const auth = await api.login({ email: email.trim().toLowerCase(), password });
      setSession(auth);
      router.push("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-DEFAULT border bg-surface px-md py-sm font-body-md text-body-md text-primary placeholder:text-on-surface-variant focus:outline-none focus:ring-1 transition";

  return (
    <>
      <div className="mb-lg">
        <h1 className="mb-xs font-headline-md text-headline-md font-bold text-primary">Welcome back</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Sign in to manage your resources.</p>
      </div>

      <form className="space-y-md" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" className="mb-xs block font-label-caps text-label-caps font-semibold text-on-surface-variant">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            aria-invalid={!!errors.email}
            className={`${inputBase} ${errors.email ? "border-error focus:border-error focus:ring-error" : "border-border-muted focus:border-indigo-accent focus:ring-indigo-accent"}`}
          />
          {errors.email && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.email}</p>}
        </div>

        <div>
          <div className="mb-xs flex items-baseline justify-between">
            <label htmlFor="password" className="block font-label-caps text-label-caps font-semibold text-on-surface-variant">
              Password
            </label>
            <Link href="/forgot-password" className="font-body-sm text-body-sm text-indigo-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            className={`${inputBase} ${errors.password ? "border-error focus:border-error focus:ring-error" : "border-border-muted focus:border-indigo-accent focus:ring-indigo-accent"}`}
          />
          {errors.password && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.password}</p>}
        </div>

        {formError && (
          <p className="rounded-DEFAULT bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-sm flex w-full items-center justify-center gap-xs rounded-DEFAULT bg-deep-navy py-2.5 font-headline-sm text-headline-sm text-white transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign In"}
          {!submitting && <ArrowRight className="h-5 w-5" />}
        </button>
      </form>

      <p className="mt-md rounded-DEFAULT border border-border-muted bg-surface-subtle px-3 py-2 text-center font-body-sm text-[12px] text-on-surface-variant">
        Demo admin — <span className="font-mono-data">admin@assetflow.com</span> / <span className="font-mono-data">Admin@123</span>
      </p>

      <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
        New here?{" "}
        <Link href="/signup" className="font-medium text-indigo-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
