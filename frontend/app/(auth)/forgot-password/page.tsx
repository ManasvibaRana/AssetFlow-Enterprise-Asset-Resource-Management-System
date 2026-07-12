"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { api } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
    } catch {
      /* endpoint always returns ok; ignore transport errors for UX */
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  const inputBase =
    "w-full rounded-DEFAULT border bg-surface px-md py-sm font-body-md text-body-md text-primary placeholder:text-on-surface-variant focus:outline-none focus:ring-1 transition";

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-md flex h-12 w-12 items-center justify-center rounded-full bg-emerald-active/10">
          <MailCheck className="h-6 w-6 text-emerald-active" />
        </div>
        <h1 className="mb-xs font-headline-md text-headline-md font-bold text-primary">Check your inbox</h1>
        <p className="max-w-[320px] font-body-md text-body-md text-on-surface-variant">
          If an account exists for <span className="font-semibold text-primary">{email}</span>, we&apos;ve sent a link to
          reset your password.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-md font-body-sm text-body-sm text-indigo-accent hover:underline"
        >
          Use a different email
        </button>
        <Link
          href="/login"
          className="mt-lg flex items-center gap-xs font-body-sm text-body-sm font-medium text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-lg">
        <h1 className="mb-xs font-headline-md text-headline-md font-bold text-primary">Forgot password?</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Enter your email and we&apos;ll send you a reset link.
        </p>
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
            aria-invalid={!!error}
            className={`${inputBase} ${error ? "border-error focus:border-error focus:ring-error" : "border-border-muted focus:border-indigo-accent focus:ring-indigo-accent"}`}
          />
          {error && <p className="mt-xs font-body-sm text-body-sm text-error">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-DEFAULT bg-deep-navy py-2.5 font-headline-sm text-headline-sm text-white transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-lg flex items-center justify-center gap-xs font-body-sm text-body-sm font-medium text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </>
  );
}
