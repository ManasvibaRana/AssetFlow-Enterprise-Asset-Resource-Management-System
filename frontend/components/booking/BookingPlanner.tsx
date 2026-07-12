"use client";

import { useEffect, useMemo, useState } from "react";
import { DoorOpen, AlertTriangle, CalendarCheck2, Users, Check, MapPin, X } from "lucide-react";
import { DateNav } from "@/components/booking/DateNav";
import { Timeline, type Booking, toMin } from "@/components/booking/Timeline";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { TimePicker } from "@/components/ui/TimePicker";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";

export type Room = { name: string; capacity: number; location: string; amenities: string[] };

// Fallback rooms until the Resources master data (Org Setup) loads.
const FALLBACK_ROOMS: Room[] = [
  { name: "Conference Room B2", capacity: 12, location: "2nd Floor, East Wing", amenities: ["Projector", "Whiteboard", "Video Conf"] },
  { name: "Conference Room A1", capacity: 6, location: "1st Floor, North", amenities: ["TV Screen", "Whiteboard"] },
  { name: "Executive Boardroom", capacity: 20, location: "5th Floor", amenities: ["Projector", "Video Conf", "Catering"] },
  { name: "Huddle Room 3", capacity: 4, location: "3rd Floor, West", amenities: ["TV Screen"] },
];
const ME = "You";

function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function addHour(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function overlaps(aS: string, aE: string, bS: string, bE: string) {
  return toMin(aS) < toMin(bE) && toMin(bS) < toMin(aE);
}

const SEED: Booking[] = [
  { id: "b1", resource: "Conference Room B2", date: "2026-07-07", start: "09:15", end: "09:45", title: "Procurement Team Sync", by: "Sarah Jenkins", invitees: ["Mike Ross", "Aditi Rao"] },
  { id: "b2", resource: "Conference Room B2", date: "2026-07-07", start: "11:00", end: "12:00", title: "Vendor Presentation", by: "Mike Ross", invitees: ["David Chen"] },
  { id: "b3", resource: "Conference Room A1", date: "2026-07-07", start: "14:00", end: "15:30", title: "Design Review", by: "Aditi Rao", invitees: [] },
];

export function BookingPlanner() {
  const [rooms, setRooms] = useState<Room[]>(FALLBACK_ROOMS);
  const [resource, setResource] = useState(FALLBACK_ROOMS[0].name);
  const [date, setDate] = useState(() => new Date("2026-07-07T12:00:00"));
  const [bookings, setBookings] = useState<Booking[]>(SEED);

  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [purpose, setPurpose] = useState("");
  const [invitees, setInvitees] = useState<string[]>([]);
  const [justBooked, setJustBooked] = useState<string | null>(null);
  const [detail, setDetail] = useState<Booking | null>(null);

  const [people, setPeople] = useState<string[]>([]);
  const [bookedBy, setBookedBy] = useState("");

  useEffect(() => {
    const me = getUser();
    if (me?.name) setBookedBy(me.name);
    api.listEmployeeOptions().then((rows) => setPeople(rows.map((r) => r.name))).catch(() => {});
    // Resources master data (managed in Organization Setup); keep fallback if none/unavailable.
    api
      .listResources()
      .then((rows) => {
        const active = rows.filter((r) => r.status !== "inactive");
        if (active.length) {
          const mapped: Room[] = active.map((r) => ({
            name: r.name,
            capacity: r.capacity,
            location: r.location ?? "",
            amenities: r.amenities ?? [],
          }));
          setRooms(mapped);
          setResource((cur) => (mapped.some((m) => m.name === cur) ? cur : mapped[0].name));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDetail(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detail]);

  const room = rooms.find((r) => r.name === resource);
  const bookedByOptions = useMemo(() => {
    const names = bookedBy && !people.includes(bookedBy) ? [bookedBy, ...people] : people;
    return names.map((n) => ({ label: n, value: n }));
  }, [people, bookedBy]);
  const inviteOptions = useMemo(() => people.filter((n) => n !== bookedBy).map((n) => ({ label: n, value: n })), [people, bookedBy]);

  const dateStr = ymd(date);
  const dayBookings = useMemo(
    () => bookings.filter((b) => b.resource === resource && b.date === dateStr).sort((a, b) => toMin(a.start) - toMin(b.start)),
    [bookings, resource, dateStr],
  );

  const validRange = toMin(end) > toMin(start);
  const clash = validRange ? dayBookings.find((b) => overlaps(start, end, b.start, b.end)) : undefined;
  const canBook = validRange && !clash && purpose.trim().length > 0;

  function selectSlot(hour: string) {
    setStart(hour);
    setEnd(addHour(hour));
    setJustBooked(null);
  }

  function book(e: React.FormEvent) {
    e.preventDefault();
    if (!canBook) return;
    const booking: Booking = { id: `b${Date.now()}`, resource, date: dateStr, start, end, title: purpose.trim(), by: bookedBy || ME, invitees };
    setBookings((prev) => [...prev, booking]);
    setJustBooked(booking.id);
    setPurpose("");
    setInvitees([]);
    setStart(end);
    setEnd(addHour(end));
  }

  function cancelBooking(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setDetail(null);
  }

  const roomOptions = rooms.map((r) => ({ label: r.name, value: r.name }));

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-lg p-lg md:p-xl">
      <div>
        <h1 className="mb-1 font-headline-md text-headline-md text-primary">Resource Booking</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Plan reservations for conference rooms — pick a slot, invite your team, and book.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-3">
        {/* Timeline column */}
        <div className="flex flex-col gap-md xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-md rounded-DEFAULT border border-border-muted bg-surface p-md shadow-card">
            <Select
              options={roomOptions}
              value={resource}
              onChange={setResource}
              icon={<DoorOpen className="h-[18px] w-[18px] text-indigo-accent" />}
              className="w-full sm:w-[280px]"
            />
            <DateNav value={date} onChange={setDate} />
          </div>

          {/* Conference room details */}
          {room && (
            <div className="flex flex-wrap items-center justify-between gap-md rounded-DEFAULT border border-border-muted bg-surface p-md shadow-card">
              <div className="flex items-center gap-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-DEFAULT bg-indigo-accent/10 text-indigo-accent">
                  <DoorOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-headline-sm text-headline-sm font-semibold text-primary">{room.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-md font-body-sm text-body-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {room.capacity} seats</span>
                    {room.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {room.location}</span>}
                  </div>
                </div>
              </div>
              {room.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((a) => (
                    <span key={a} className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-caps text-[10px] font-semibold text-on-surface-variant">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <Timeline
            bookings={dayBookings}
            preview={validRange && !clash ? { start, end } : null}
            onSlotClick={selectSlot}
            onBookingClick={setDetail}
          />
        </div>

        {/* Reservation form */}
        <div className="sticky top-24 h-fit rounded-DEFAULT border border-border-muted bg-surface p-md shadow-card">
          <h2 className="mb-md border-b border-border-muted pb-sm font-headline-sm text-headline-sm font-semibold text-primary">New Reservation</h2>
          <form className="space-y-md" onSubmit={book}>
            <Field label="Target Resource">
              <Select
                options={roomOptions}
                value={resource}
                onChange={setResource}
                icon={<DoorOpen className="h-[18px] w-[18px] text-on-surface-variant" />}
              />
            </Field>

            <div className="grid grid-cols-2 gap-sm">
              <Field label="Date">
                <div className="flex items-center gap-sm rounded-DEFAULT border border-border-muted bg-surface-subtle p-sm font-body-sm text-body-sm text-on-surface">
                  <CalendarCheck2 className="h-[18px] w-[18px] shrink-0 text-on-surface-variant" />
                  <span className="truncate">{fmtDate(date)}</span>
                </div>
              </Field>
              <Field label="Requested By">
                <Select options={bookedByOptions} value={bookedBy} onChange={setBookedBy} placeholder="Select…" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <Field label="Start Time">
                <TimePicker value={start} onChange={setStart} step={15} tone={clash || !validRange ? "warning" : "default"} />
              </Field>
              <Field label="End Time">
                <TimePicker value={end} onChange={setEnd} step={15} tone={clash || !validRange ? "warning" : "default"} />
              </Field>
            </div>

            <Field label="Invite Team">
              <MultiSelect
                options={inviteOptions}
                value={invitees}
                onChange={setInvitees}
                placeholder="Add colleagues…"
                icon={<Users className="h-[18px] w-[18px] shrink-0 text-on-surface-variant" />}
              />
            </Field>

            {!validRange ? (
              <div className="rounded-r-DEFAULT border-l-4 border-status-warning bg-status-warning/10 p-sm">
                <p className="font-body-sm text-body-sm font-semibold text-status-warning">End time must be after start time.</p>
              </div>
            ) : clash ? (
              <div className="rounded-r-DEFAULT border-l-4 border-status-warning bg-status-warning/10 p-sm">
                <div className="flex items-start gap-sm">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-status-warning" />
                  <div>
                    <p className="font-body-sm text-body-sm font-semibold text-status-warning">Scheduling Conflict</p>
                    <p className="mt-xs font-body-sm text-xs text-status-warning/80">
                      Overlaps “{clash.title}” ({clash.start}–{clash.end}). Pick another slot.
                    </p>
                  </div>
                </div>
              </div>
            ) : justBooked ? (
              <div className="rounded-r-DEFAULT border-l-4 border-emerald-active bg-emerald-active/10 p-sm">
                <p className="flex items-center gap-xs font-body-sm text-body-sm font-semibold text-emerald-active">
                  <Check className="h-4 w-4" /> Booked — added to the schedule.
                </p>
              </div>
            ) : null}

            <Field label="Purpose / Notes">
              <input
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  setJustBooked(null);
                }}
                placeholder="e.g. Q3 Planning Session"
                className="w-full rounded-DEFAULT border border-border-muted px-sm py-sm font-body-sm text-body-sm text-on-surface outline-none transition-colors focus:border-indigo-accent focus:ring-1 focus:ring-indigo-accent"
              />
            </Field>

            <div className="flex gap-sm border-t border-border-muted pt-sm">
              <button
                type="button"
                onClick={() => {
                  setPurpose("");
                  setInvitees([]);
                  setJustBooked(null);
                }}
                className="flex-1 rounded-DEFAULT border border-border-muted bg-surface py-sm font-body-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-subtle"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!canBook}
                className="flex flex-1 items-center justify-center gap-xs rounded-DEFAULT bg-emerald-active py-sm font-body-sm text-body-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CalendarCheck2 className="h-[18px] w-[18px]" /> Book Slot
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Booking detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={() => setDetail(null)} />
          <div role="dialog" aria-label="Booking details" className="relative z-10 w-full max-w-md rounded-lg border border-border-muted bg-surface p-lg shadow-lifted">
            <div className="mb-md flex items-start justify-between gap-md">
              <div>
                <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Reservation</p>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">{detail.title}</h2>
              </div>
              <button aria-label="Close" onClick={() => setDetail(null)} className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-md">
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <p className="mb-xs font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Resource</p>
                  <p className="flex items-center gap-1 font-body-md text-body-md text-on-surface"><DoorOpen className="h-4 w-4 text-on-surface-variant" /> {detail.resource}</p>
                </div>
                <div>
                  <p className="mb-xs font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Time</p>
                  <p className="font-mono-data text-mono-data text-on-surface">{detail.start} – {detail.end}</p>
                </div>
                <div>
                  <p className="mb-xs font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Date</p>
                  <p className="font-body-md text-body-md text-on-surface">{fmtDate(new Date(`${detail.date}T12:00:00`))}</p>
                </div>
                <div>
                  <p className="mb-xs font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Booked By</p>
                  <p className="font-body-md text-body-md text-on-surface">{detail.by}</p>
                </div>
              </div>
              <div>
                <p className="mb-xs font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Invited ({detail.invitees.length})</p>
                {detail.invitees.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">No one invited.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {detail.invitees.map((n) => (
                      <span key={n} className="rounded-full bg-indigo-accent/10 px-2 py-0.5 font-body-sm text-[11px] font-medium text-indigo-accent">{n}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-lg flex gap-sm border-t border-border-muted pt-md">
              <button type="button" onClick={() => setDetail(null)} className="flex-1 rounded-DEFAULT border border-border-muted bg-surface py-sm font-body-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-subtle">
                Close
              </button>
              <button type="button" onClick={() => cancelBooking(detail.id)} className="flex-1 rounded-DEFAULT border border-error/40 bg-error/5 py-sm font-body-sm text-body-sm font-semibold text-error transition-colors hover:bg-error/10">
                Cancel booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
