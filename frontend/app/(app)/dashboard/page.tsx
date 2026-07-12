"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Bell, Boxes, ClipboardCheck, Plus, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { dateTime, insight } from "@/lib/insight";

type Dashboard = { total_assets:number; available:number; allocated:number; maintenance:number; lost:number; overdue:number; unread_notifications:number; utilization:number; recent_activity:{id:string;action:string;entity_type:string;timestamp:string}[] };

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null), [error, setError] = useState("");
  useEffect(() => { insight<Dashboard>("/dashboard").then(setData).catch(e => setError(e.message)); }, []);
  const cards = data && [
    ["Total assets", data.total_assets, "border-t-deep-navy"], ["Available", data.available, "border-t-emerald-active"],
    ["Allocated", data.allocated, "border-t-indigo-accent"], ["Maintenance", data.maintenance, "border-t-status-warning"],
    ["Lost", data.lost, "border-t-status-critical"], ["Utilization", `${data.utilization}%`, "border-t-indigo-accent"],
  ];
  return <div className="mx-auto flex max-w-[1440px] flex-col gap-lg p-lg md:p-xl">
    <header className="flex flex-col justify-between gap-md md:flex-row md:items-end"><div><p className="font-label-caps text-label-caps font-semibold uppercase tracking-wider text-indigo-accent">Operational command</p><h1 className="font-display-lg text-display-lg text-primary">Today&apos;s overview</h1><p className="text-on-surface-variant">Live health of your asset ecosystem.</p></div><div className="flex gap-sm"><Link href="/assets" className="flex items-center gap-xs rounded-DEFAULT bg-deep-navy px-md py-2 text-white"><Plus className="h-4 w-4"/>Register asset</Link><Link href="/audit" className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-md py-2"><ClipboardCheck className="h-4 w-4"/>Start audit</Link></div></header>
    {error && <div role="alert" className="rounded-DEFAULT border border-status-critical/30 bg-status-critical/10 p-md text-status-critical">{error}</div>}
    {!data ? <div className="h-28 animate-pulse rounded-DEFAULT bg-surface-container"/> : <>
      {data.overdue > 0 && <Link href="/assets" className="flex items-center justify-between rounded-DEFAULT border border-status-warning/30 bg-status-warning/10 p-md text-sm"><span className="flex items-center gap-sm font-semibold"><AlertTriangle className="h-5 w-5 text-status-warning"/>{data.overdue} asset returns are overdue</span><ArrowUpRight className="h-4 w-4"/></Link>}
      <section className="grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-6">{cards?.map(([label,value,accent]) => <article key={label} className={`rounded-DEFAULT border border-border-muted border-t-2 bg-surface p-md shadow-card ${accent}`}><p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">{label}</p><strong className="mt-sm block font-display-lg text-display-lg text-primary">{value}</strong></article>)}</section>
      <section className="grid gap-lg lg:grid-cols-[1.4fr_1fr]"><article className="rounded-DEFAULT border border-border-muted bg-surface shadow-card"><div className="flex items-center justify-between border-b border-border-muted p-md"><h2 className="font-headline-sm text-headline-sm">Recent activity</h2><Link href="/notifications" className="text-sm font-semibold text-indigo-accent">View log</Link></div><ul className="divide-y divide-border-muted">{data.recent_activity.length ? data.recent_activity.map(x => <li key={x.id} className="flex gap-sm p-md"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-accent"/><div><p className="font-medium">{x.action}</p><p className="text-sm capitalize text-on-surface-variant">{x.entity_type.replaceAll("_"," ")} · {dateTime(x.timestamp)}</p></div></li>) : <li className="p-xl text-center text-on-surface-variant">Activity will appear as your team works.</li>}</ul></article><div className="grid gap-md"><Link href="/notifications" className="flex items-center justify-between rounded-DEFAULT border border-border-muted bg-surface p-lg shadow-card"><span><Bell className="mb-md h-6 w-6 text-indigo-accent"/><b className="block text-2xl">{data.unread_notifications}</b><small className="text-on-surface-variant">Unread notifications</small></span><ArrowUpRight/></Link><div className="grid grid-cols-2 gap-md"><Link href="/reports" className="rounded-DEFAULT border border-border-muted bg-surface p-md"><Boxes className="mb-sm"/><b>Reports</b></Link><Link href="/maintenance" className="rounded-DEFAULT border border-border-muted bg-surface p-md"><Wrench className="mb-sm"/><b>Maintenance</b></Link></div></div></section>
    </>}
  </div>;
}
