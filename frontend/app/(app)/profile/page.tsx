"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Building2, KeyRound, LogOut, CircleCheck, UserCog } from "lucide-react";
import { api, ApiError, type AuthUser } from "@/lib/api";
import { clearSession, updateStoredUser } from "@/lib/auth";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { fieldLabel, fieldInput } from "@/components/ui/Modal";
import { initials } from "@/lib/mock/org";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    api
      .me()
      .then((u) => {
        setUser(u);
        setName(u.name);
        setTitle(u.title);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2500);
  }

  async function saveDetails() {
    if (!name.trim()) return setDetailsError("Name is required.");
    setDetailsError("");
    setSavingDetails(true);
    try {
      const updated = await api.updateProfile({ name: name.trim(), title: title.trim() });
      setUser(updated);
      updateStoredUser(updated);
      window.dispatchEvent(new Event("storage"));
      flash("Profile updated");
    } catch (e) {
      setDetailsError(e instanceof ApiError ? e.message : "Failed to save.");
    } finally {
      setSavingDetails(false);
    }
  }

  async function changePassword() {
    setPwError("");
    if (!current) return setPwError("Enter your current password.");
    if (next.length < 8) return setPwError("New password must be at least 8 characters.");
    if (next !== confirm) return setPwError("New passwords do not match.");
    setSavingPw(true);
    try {
      await api.changePassword({ current_password: current, new_password: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      flash("Password changed");
    } catch (e) {
      setPwError(e instanceof ApiError ? e.message : "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  }

  function signOut() {
    clearSession();
    router.push("/login");
  }

  if (loading) return <div className="p-xl font-body-sm text-body-sm text-on-surface-variant">Loading profile…</div>;
  if (!user) return <div className="p-xl font-body-sm text-body-sm text-error">Could not load your profile.</div>;

  const dirty = name !== user.name || title !== user.title;

  return (
    <div className="mx-auto w-full max-w-6xl p-lg md:p-xl">
      <h1 className="mb-lg font-display-lg text-display-lg text-primary">My Profile</h1>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        {/* Left — identity summary */}
        <aside className="lg:col-span-1">
          <div className="overflow-hidden rounded-xl border border-border-muted bg-surface lg:sticky lg:top-24">
            <div className="h-24 bg-gradient-to-br from-deep-navy to-primary-container" />
            <div className="-mt-12 flex flex-col items-center px-lg pb-lg text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-indigo-accent/10 font-display-lg text-display-lg font-semibold text-indigo-accent">
                {initials(user.name)}
              </div>
              <p className="mt-sm font-headline-sm text-headline-sm text-primary">{user.name}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{user.title || "—"}</p>
              <div className="mt-md flex flex-wrap items-center justify-center gap-sm">
                <RoleBadge role={user.role} />
                <StatusPill status={user.status} />
              </div>

              <div className="mt-lg w-full space-y-sm border-t border-border-muted pt-lg text-left">
                <InfoRow icon={Mail} label="Email" value={user.email} mono />
                <InfoRow icon={Building2} label="Department" value={user.department ?? "—"} />
              </div>
            </div>
          </div>
        </aside>

        {/* Right — editable sections */}
        <div className="space-y-lg lg:col-span-2">
          <Section title="Personal details" icon={UserCog}>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <div>
                <label className={fieldLabel}>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldInput} placeholder="e.g. Software Engineer" />
              </div>
            </div>
            {detailsError && <p className="mt-sm font-body-sm text-body-sm text-error">{detailsError}</p>}
            <div className="mt-md flex justify-end">
              <button
                onClick={saveDetails}
                disabled={!dirty || savingDetails}
                className="rounded-DEFAULT bg-deep-navy px-5 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {savingDetails ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Section>

          <Section title="Set new password" icon={KeyRound}>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <div className="sm:col-span-2">
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
            </div>
            {pwError && <p className="mt-sm font-body-sm text-body-sm text-error">{pwError}</p>}
            <div className="mt-md flex justify-end">
              <button
                onClick={changePassword}
                disabled={savingPw}
                className="rounded-DEFAULT bg-deep-navy px-5 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {savingPw ? "Updating..." : "Update password"}
              </button>
            </div>
          </Section>

          <div className="flex items-center justify-between rounded-xl border border-border-muted bg-surface p-lg">
            <div>
              <p className="font-headline-sm text-headline-sm text-primary">Sign out</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">End your session on this device.</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-status-critical transition-colors hover:bg-error-container/40"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-sm rounded-DEFAULT border border-border-muted bg-surface px-4 py-3 shadow-lifted">
          <CircleCheck className="h-5 w-5 text-emerald-active" />
          <span className="font-body-sm text-body-sm text-on-surface">{toast}</span>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border-muted bg-surface p-lg">
      <div className="mb-md flex items-center gap-sm">
        <Icon className="h-5 w-5 text-on-surface-variant" />
        <h2 className="font-headline-sm text-headline-sm text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: typeof Mail; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-label-caps text-[11px] font-semibold text-on-surface-variant">{label}</p>
        <p className={`truncate text-on-surface ${mono ? "font-mono-data text-mono-data" : "font-body-sm text-body-sm"}`}>{value}</p>
      </div>
    </div>
  );
}
