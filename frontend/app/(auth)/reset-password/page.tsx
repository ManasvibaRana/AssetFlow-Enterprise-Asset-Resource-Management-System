"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) return setError("This reset link is missing its token.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setSubmitting(true);
    try {
      await api.resetPassword({ token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-md flex h-12 w-12 items-center justify-center rounded-full bg-emerald-active/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-active" />
        </div>
        <h1 className="mb-xs font-headline-md text-headline-md font-bold text-primary">Password updated</h1>
        <p className="max-w-[320px] font-body-md text-body-md text-on-surface-variant">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-lg rounded-DEFAULT bg-deep-navy px-5 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-lg">
        <h1 className="mb-xs font-headline-md text-headline-md font-bold text-primary">Set a new password</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Choose a strong password you haven&apos;t used before.</p>
      </div>

      <form className="space-y-md" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="new" className="mb-xs block font-label-caps text-label-caps font-semibold text-on-surface-variant">
            New password
          </label>
          <PasswordInput id="new" value={password} onChange={setPassword} autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-xs block font-label-caps text-label-caps font-semibold text-on-surface-variant">
            Confirm new password
          </label>
          <PasswordInput id="confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>

        {error && (
          <p className="rounded-DEFAULT bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-DEFAULT bg-deep-navy py-2.5 font-headline-sm text-headline-sm text-white transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {submitting ? "Updating..." : "Update password"}
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
