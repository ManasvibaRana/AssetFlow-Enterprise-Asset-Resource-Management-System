"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length === 0) {
      // TODO: replace with real auth call
      router.push("/dashboard");
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
            <Link href="#" className="font-body-sm text-body-sm text-indigo-accent hover:underline">
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

        <button
          type="submit"
          className="mt-sm flex w-full items-center justify-center gap-xs rounded-DEFAULT bg-deep-navy py-2.5 font-headline-sm text-headline-sm text-white transition-colors hover:bg-primary-container"
        >
          Sign In
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
        New here?{" "}
        <Link href="/signup" className="font-medium text-indigo-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
