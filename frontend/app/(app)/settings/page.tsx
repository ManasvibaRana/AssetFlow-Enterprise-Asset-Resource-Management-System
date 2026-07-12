"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, KeyRound, LogOut, CircleCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { clearSession, getUser } from "@/lib/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { fieldLabel } from "@/components/ui/Modal";

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [email, setEmail] = useState("");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "dark" : "light");
    setEmail(getUser()?.email ?? "");
  }, []);

  function applyTheme(t: "light" | "dark") {
    setTheme(t);
    localStorage.setItem("theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }

  async function changePassword() {
    setPwError("");
    if (!current) return setPwError("Enter your current password.");
    if (next.length < 8) return setPwError("New password must be at least 8 characters.");
    if (next !== confirm) return setPwError("New passwords do not match.");
    setSaving(true);
    try {
      await api.changePassword({ current_password: current, new_password: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      setToast("Password changed");
      window.setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setPwError(e instanceof ApiError ? e.message : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-lg md:p-xl">
      <h1 className="mb-1 font-display-lg text-display-lg text-primary">Settings</h1>
      <p className="mb-lg font-body-lg text-body-lg text-on-surface-variant">Appearance, security, and account.</p>

      {/* Appearance */}
      <section className="mb-lg rounded-DEFAULT border border-border-muted bg-surface p-lg">
        <h2 className="mb-1 font-headline-sm text-headline-sm text-primary">Appearance</h2>
        <p className="mb-md font-body-sm text-body-sm text-on-surface-variant">Choose how AssetFlow looks to you.</p>
        <div className="grid grid-cols-2 gap-md sm:max-w-md">
          <ThemeCard active={theme === "light"} onClick={() => applyTheme("light")} icon={Sun} label="Light" />
          <ThemeCard active={theme === "dark"} onClick={() => applyTheme("dark")} icon={Moon} label="Dark" />
        </div>
      </section>

      {/* Change password */}
      <section className="mb-lg rounded-DEFAULT border border-border-muted bg-surface p-lg">
        <div className="mb-md flex items-center gap-sm">
          <KeyRound className="h-5 w-5 text-on-surface-variant" />
          <h2 className="font-headline-sm text-headline-sm text-primary">Change password</h2>
        </div>
        <div className="grid grid-cols-1 gap-md sm:max-w-md">
          <div>
            <label className={fieldLabel}>Current password</label>
            <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
          </div>
          <div>
            <label className={fieldLabel}>New password</label>
            <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
          </div>
          <div>
            <label className={fieldLabel}>Confirm new password</label>
            <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </div>
          {pwError && <p className="font-body-sm text-body-sm text-error">{pwError}</p>}
          <div>
            <button
              onClick={changePassword}
              disabled={saving}
              className="rounded-DEFAULT bg-deep-navy px-5 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="rounded-DEFAULT border border-border-muted bg-surface p-lg">
        <h2 className="mb-md font-headline-sm text-headline-sm text-primary">Account</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-label-caps text-label-caps font-semibold text-on-surface-variant">Signed in as</p>
            <p className="font-mono-data text-mono-data text-on-surface">{email || "—"}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-status-critical transition-colors hover:bg-error-container/40"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-sm rounded-DEFAULT border border-border-muted bg-surface px-4 py-3 shadow-lifted">
          <CircleCheck className="h-5 w-5 text-emerald-active" />
          <span className="font-body-sm text-body-sm text-on-surface">{toast}</span>
        </div>
      )}
    </div>
  );
}

function ThemeCard({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sun;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-sm rounded-DEFAULT border-2 p-md transition-colors " +
        (active
          ? "border-indigo-accent bg-indigo-accent/5 text-primary"
          : "border-border-muted bg-surface text-on-surface-variant hover:border-outline-variant")
      }
    >
      <Icon className={"h-5 w-5 " + (active ? "text-indigo-accent" : "")} />
      <span className="font-body-md text-body-md font-semibold">{label}</span>
    </button>
  );
}
