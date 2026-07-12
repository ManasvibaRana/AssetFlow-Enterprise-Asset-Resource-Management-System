"use client";

import { useEffect, useState } from "react";
import { Mail, Building2, CircleCheck } from "lucide-react";
import { api, ApiError, type AuthUser } from "@/lib/api";
import { updateStoredUser } from "@/lib/auth";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { fieldLabel, fieldInput } from "@/components/ui/Modal";
import { initials } from "@/lib/mock/org";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    api
      .me()
      .then((u) => {
        setUser(u);
        setName(u.name);
        setTitle(u.title);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateProfile({ name: name.trim(), title: title.trim() });
      setUser(updated);
      updateStoredUser(updated);
      window.dispatchEvent(new Event("storage"));
      setToast("Profile updated");
      window.setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-xl font-body-sm text-body-sm text-on-surface-variant">Loading profile…</div>;
  if (!user) return <div className="p-xl font-body-sm text-body-sm text-error">{error || "Not found."}</div>;

  const dirty = name !== user.name || title !== user.title;

  return (
    <div className="mx-auto w-full max-w-3xl p-lg md:p-xl">
      <h1 className="mb-1 font-display-lg text-display-lg text-primary">My Profile</h1>
      <p className="mb-lg font-body-lg text-body-lg text-on-surface-variant">Your account details and access level.</p>

      {/* Identity card */}
      <div className="mb-lg flex flex-col items-start gap-md rounded-DEFAULT border border-border-muted bg-surface p-lg sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-accent/10 font-headline-md text-headline-md font-semibold text-indigo-accent">
          {initials(user.name)}
        </div>
        <div className="flex-1">
          <p className="font-headline-sm text-headline-sm text-primary">{user.name}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{user.title || "—"}</p>
          <div className="mt-sm flex flex-wrap items-center gap-sm">
            <RoleBadge role={user.role} />
            <StatusPill status={user.status} />
          </div>
        </div>
      </div>

      {/* Read-only facts */}
      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2">
        <Fact icon={Mail} label="Email" value={user.email} mono />
        <Fact icon={Building2} label="Department" value={user.department ?? "—"} />
      </div>

      {/* Editable */}
      <div className="rounded-DEFAULT border border-border-muted bg-surface p-lg">
        <h2 className="mb-md font-headline-sm text-headline-sm text-primary">Edit details</h2>
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
        {error && <p className="mt-sm font-body-sm text-body-sm text-error">{error}</p>}
        <div className="mt-md flex justify-end">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="rounded-DEFAULT bg-deep-navy px-5 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
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

function Fact({ icon: Icon, label, value, mono }: { icon: typeof Mail; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-sm rounded-DEFAULT border border-border-muted bg-surface p-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-label-caps text-label-caps font-semibold text-on-surface-variant">{label}</p>
        <p className={`truncate text-on-surface ${mono ? "font-mono-data text-mono-data" : "font-body-sm text-body-sm"}`}>{value}</p>
      </div>
    </div>
  );
}
