"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length === 0) {
      // TODO: replace with real signup call — always creates an Employee account
      router.push("/dashboard");
    }
  }

  const inputBase =
    "w-full rounded-DEFAULT border bg-surface px-md py-sm font-body-md text-body-md text-primary placeholder:text-on-surface-variant focus:outline-none focus:ring-1 transition";
  const errClass = "border-error focus:border-error focus:ring-error";
  const okClass = "border-border-muted focus:border-indigo-accent focus:ring-indigo-accent";

  return (
    <>
      <div className="mb-lg">
        <h1 className="mb-xs font-headline-md text-headline-md font-bold text-primary">Create your account</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Sign up to get started.</p>
      </div>

      <form className="space-y-md" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="fullName" className="mb-xs block font-label-caps text-label-caps font-semibold text-on-surface-variant">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={form.fullName}
            onChange={update("fullName")}
            placeholder="Jane Doe"
            aria-invalid={!!errors.fullName}
            className={`${inputBase} ${errors.fullName ? errClass : okClass}`}
          />
          {errors.fullName && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-xs block font-label-caps text-label-caps font-semibold text-on-surface-variant">
            Work Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="name@company.com"
            aria-invalid={!!errors.email}
            className={`${inputBase} ${errors.email ? errClass : okClass}`}
          />
          {errors.email && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-xs block font-label-caps text-label-caps font-semibold text-on-surface-variant">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            className={`${inputBase} ${errors.password ? errClass : okClass}`}
          />
          {errors.password && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirm" className="mb-xs block font-label-caps text-label-caps font-semibold text-on-surface-variant">
            Confirm Password
          </label>
          <input
            id="confirm"
            type="password"
            value={form.confirm}
            onChange={update("confirm")}
            placeholder="••••••••"
            aria-invalid={!!errors.confirm}
            className={`${inputBase} ${errors.confirm ? errClass : okClass}`}
          />
          {errors.confirm && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.confirm}</p>}
        </div>

        <div className="flex items-start gap-sm rounded-DEFAULT border border-border-muted bg-surface-subtle p-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" />
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            New accounts are created as <span className="font-semibold text-primary">Employee</span>. Department Head and
            Asset Manager roles are assigned later by an admin.
          </p>
        </div>

        <button
          type="submit"
          className="mt-sm w-full rounded-DEFAULT bg-emerald-active py-2.5 font-body-md text-body-md font-semibold text-white transition-opacity hover:opacity-90"
        >
          Create Account
        </button>
      </form>

      <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
