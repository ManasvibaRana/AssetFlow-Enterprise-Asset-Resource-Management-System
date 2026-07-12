"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthed } from "@/lib/auth";

type History = { id: number; event_type: string; detail: string; created_at: string };
type Asset = { id: number; name: string; asset_tag: string; serial_number?: string; condition: string; location?: string; status: string; is_bookable: boolean; acquisition_cost?: string; active_allocation?: { holder_emp_id?: string; holder_dept_id?: string; expected_return_date?: string }; history: History[] };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(typeof body.detail === "string" ? body.detail : body.detail?.message ?? "Request failed"); }
  return res.json();
}

export default function AssetsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]), [query, setQuery] = useState(""), [filter, setFilter] = useState("all"), [selected, setSelected] = useState<Asset | null>(null), [modal, setModal] = useState<"register" | "allocate" | "return" | "transfer" | null>(null), [message, setMessage] = useState("");
  const load = () => request("/assets").then(setAssets).catch(e => setMessage(e.message));
  useEffect(() => {
    if (!isAuthed()) router.replace("/login");
    else { setReady(true); load(); }
  }, [router]);
  const shown = useMemo(() => assets.filter(a => (filter === "all" || a.status === filter) && [a.name, a.asset_tag, a.serial_number, a.location].some(v => v?.toLowerCase().includes(query.toLowerCase()))), [assets, filter, query]);
  const count = (status: string) => assets.filter(a => a.status === status).length;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget), data = Object.fromEntries(form);
    try {
      if (modal === "register") await request("/assets", { method: "POST", body: JSON.stringify({ ...data, category_id: data.category_id || null, acquisition_date: data.acquisition_date || null, acquisition_cost: data.acquisition_cost || null, photo_url: data.photo_url || null, is_bookable: form.has("is_bookable") }) });
      if (modal === "allocate" && selected) await request(`/assets/${selected.id}/allocate`, { method: "POST", body: JSON.stringify({ [data.holder_type === "department" ? "holder_dept_id" : "holder_emp_id"]: data.holder_id, expected_return_date: data.expected_return_date || null }) });
      if (modal === "return" && selected) await request(`/assets/${selected.id}/return`, { method: "POST", body: JSON.stringify(data) });
      if (modal === "transfer" && selected) await request(`/assets/${selected.id}/transfers`, { method: "POST", body: JSON.stringify({ to_holder: `${data.holder_type}:${data.holder_id}` }) });
      setModal(null); setMessage("Saved successfully"); await load();
    } catch (error) { setMessage((error as Error).message); }
  }

  if (!ready) return null;
  return <div className="shell">
    <aside><div className="brand"><span>AF</span><b>AssetFlow</b></div><nav aria-label="Main navigation"><a>Overview</a><a className="active">Assets</a><a>Allocations</a><a>Bookings</a><a>Maintenance</a><a>Audit</a><a>Reports</a></nav><div className="profile"><div>AM</div><span><b>Alex Morgan</b><small>Asset Manager</small></span></div></aside>
    <main>
      <header><div><p className="eyebrow">ASSET OPERATIONS</p><h1>Asset registry</h1><p>Register, locate and manage every asset through its lifecycle.</p></div><button className="primary" onClick={() => setModal("register")}>＋ Register asset</button></header>
      {message && <div className="toast" role="status" onClick={() => setMessage("")}>{message}<span>×</span></div>}
      <section className="metrics"><article><small>TOTAL ASSETS</small><strong>{assets.length}</strong><em>Across all locations</em></article><article className="green"><small>AVAILABLE</small><strong>{count("available")}</strong><em>Ready to allocate</em></article><article className="blue"><small>ALLOCATED</small><strong>{count("allocated")}</strong><em>Currently assigned</em></article><article className="amber"><small>NEEDS ATTENTION</small><strong>{count("under_maintenance") + count("lost")}</strong><em>Maintenance or lost</em></article></section>
      <section className="registry"><div className="toolbar"><div><h2>All assets</h2><span>{shown.length} records</span></div><div className="controls"><input aria-label="Search assets" type="search" placeholder="Search tag, serial or name…" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filter by status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option><option value="available">Available</option><option value="allocated">Allocated</option><option value="under_maintenance">Maintenance</option><option value="lost">Lost</option></select></div></div>
        <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Category</th><th>Location</th><th>Condition</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{shown.map(a => <tr key={a.id} onClick={() => setSelected(a)} className={selected?.id === a.id ? "selected" : ""}><td><b>{a.name}</b><code>{a.asset_tag}</code><small>{a.serial_number || "No serial"}</small></td><td>Equipment</td><td>{a.location || "Unassigned"}</td><td className="capitalize">{a.condition}</td><td><span className={`status ${a.status}`}>{a.status.replaceAll("_", " ")}</span></td><td><button className="more" aria-label={`Manage ${a.name}`}>•••</button></td></tr>)}</tbody></table>{shown.length === 0 && <div className="empty">No assets match these filters.</div>}</div>
      </section>
      {selected && <section className="drawer"><button className="close" aria-label="Close details" onClick={() => setSelected(null)}>×</button><p className="eyebrow">{selected.asset_tag}</p><h2>{selected.name}</h2><span className={`status ${selected.status}`}>{selected.status.replaceAll("_", " ")}</span><dl><div><dt>Serial number</dt><dd>{selected.serial_number || "—"}</dd></div><div><dt>Location</dt><dd>{selected.location || "—"}</dd></div><div><dt>Condition</dt><dd>{selected.condition}</dd></div></dl><div className="actions">{selected.status === "available" ? <button className="primary" onClick={() => setModal("allocate")}>Allocate asset</button> : <><button onClick={() => setModal("transfer")}>Request transfer</button><button onClick={() => setModal("return")}>Return asset</button></>}</div><h3>Lifecycle history</h3><ol className="timeline">{selected.history.map(h => <li key={h.id}><i /><div><b>{h.event_type.replaceAll("_", " ")}</b><p>{h.detail}</p><small>{new Date(h.created_at).toLocaleString()}</small></div></li>)}</ol></section>}
    </main>
    {modal && <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(null)}><dialog open><button className="close" aria-label="Close form" onClick={() => setModal(null)}>×</button><p className="eyebrow">ASSET LIFECYCLE</p><h2>{modal === "register" ? "Register new asset" : `${modal[0].toUpperCase() + modal.slice(1)} ${selected?.asset_tag}`}</h2><form onSubmit={submit}>{modal === "register" && <><label>Asset name<input name="name" required placeholder="e.g. MacBook Pro 14”" /></label><div className="pair"><label>Serial number<input name="serial_number" /></label><label>Category ID<input name="category_id" /></label></div><div className="pair"><label>Acquisition date<input name="acquisition_date" type="date" /></label><label>Cost<input name="acquisition_cost" type="number" min="0" step="0.01" /></label></div><div className="pair"><label>Condition<select name="condition"><option>new</option><option>good</option><option>fair</option><option>poor</option></select></label><label>Location<input name="location" /></label></div><label>Photo URL<input name="photo_url" type="url" placeholder="https://…" /></label><label className="check"><input name="is_bookable" type="checkbox" /> Available for booking</label></>}{modal === "allocate" && <><div className="pair"><label>Holder type<select name="holder_type"><option value="employee">Employee</option><option value="department">Department</option></select></label><label>Holder ID<input name="holder_id" required /></label></div><label>Expected return<input name="expected_return_date" type="date" /></label></>}{modal === "transfer" && <div className="pair"><label>New holder type<select name="holder_type"><option value="employee">Employee</option><option value="department">Department</option></select></label><label>New holder ID<input name="holder_id" required /></label></div>}{modal === "return" && <label>Check-in notes<textarea name="checkin_notes" rows={4} placeholder="Condition on return…" /></label>}<footer><button type="button" onClick={() => setModal(null)}>Cancel</button><button className="primary">Confirm</button></footer></form></dialog></div>}
  </div>;
}
