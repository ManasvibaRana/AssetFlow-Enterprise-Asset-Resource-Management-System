import { DoorOpen, AlertTriangle, Lock } from "lucide-react";
import { DateNav } from "@/components/booking/DateNav";
import { Timeline, type Booking } from "@/components/booking/Timeline";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";

// Demo resources for the selector.
const resources = [
  "Conference Room B2",
  "Conference Room A1",
  "Projector PRO-7",
  "Company Vehicle - Van 3",
].map((r) => ({ label: r, value: r }));

const bookings: Booking[] = [
  { hour: "09:00", title: "Procurement Team Sync", time: "09:15 - 09:45", by: "Sarah Jenkins", top: "25%", height: "50%" },
  { hour: "11:00", title: "Vendor Presentation", time: "11:00 - 12:00", by: "Mike Ross", top: "0%", height: "100%" },
];

// A requested slot that overlaps an existing booking — the core "no double-booking" rule.
const conflict = {
  hour: "09:00",
  label: "Requested: Q3 Planning (09:30 - 10:15)",
  top: "50%",
  height: "75%",
};

export default function BookingPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-lg p-lg md:p-xl">
      {/* Header */}
      <div>
        <h1 className="mb-1 font-headline-md text-headline-md text-primary">Resource Booking</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Manage scheduling and reservations for shared facilities and high-value equipment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-3">
        {/* Timeline column */}
        <div className="flex flex-col gap-md xl:col-span-2">
          {/* Resource selector + date nav */}
          <div className="flex flex-wrap items-center justify-between gap-md rounded-DEFAULT border border-border-muted bg-surface p-md shadow-card">
            <Select
              options={resources}
              defaultValue="Conference Room B2"
              icon={<DoorOpen className="h-[18px] w-[18px] text-indigo-accent" />}
              className="w-full sm:w-[280px]"
            />
            <DateNav initial="2026-07-07" />
          </div>

          {/* Daily timeline — full day, scrollable, click a slot to quick-add */}
          <Timeline bookings={bookings} conflict={conflict} />
        </div>

        {/* New reservation form */}
        <div className="sticky top-24 h-fit rounded-DEFAULT border border-border-muted bg-surface p-md shadow-card">
          <h2 className="mb-md border-b border-border-muted pb-sm font-headline-sm text-headline-sm font-semibold text-primary">
            New Reservation
          </h2>
          <form className="space-y-md">
            <Field label="Target Resource">
              <div className="flex items-center gap-sm rounded-DEFAULT border border-border-muted bg-surface-subtle p-sm font-body-md text-body-md text-on-surface">
                <DoorOpen className="h-[18px] w-[18px] text-on-surface-variant" />
                Conference Room B2
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-sm">
              <Field label="Date">
                <DatePicker defaultValue="2026-07-07" />
              </Field>
              <Field label="Requested By">
                <Input type="text" readOnly defaultValue="Priya Shah" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <Field label="Start Time">
                <TimePicker tone="warning" defaultValue="09:30" step={15} />
              </Field>
              <Field label="End Time">
                <TimePicker tone="warning" defaultValue="10:30" step={15} />
              </Field>
            </div>

            {/* Conflict alert — mirrors the overlap rule the backend enforces */}
            <div className="rounded-r-DEFAULT border-l-4 border-status-warning bg-status-warning/10 p-sm">
              <div className="flex items-start gap-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-status-warning" />
                <div>
                  <p className="font-body-sm text-body-sm font-semibold text-status-warning">Scheduling Conflict</p>
                  <p className="mt-xs font-body-sm text-xs text-status-warning/80">
                    The selected time slot overlaps with an existing reservation (09:15 - 09:45).
                  </p>
                </div>
              </div>
            </div>

            <Field label="Purpose / Notes">
              <Textarea rows={3} defaultValue="Q3 Planning Session" placeholder="Brief description for the booking..." />
            </Field>

            <div className="flex gap-sm border-t border-border-muted pt-sm">
              <button type="button" className="flex-1 rounded-DEFAULT border border-border-muted bg-surface py-sm font-body-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-subtle">
                Cancel
              </button>
              <button type="submit" disabled className="flex flex-1 cursor-not-allowed items-center justify-center gap-xs rounded-DEFAULT bg-primary/50 py-sm font-body-sm text-body-sm font-medium text-white">
                Book Slot <Lock className="h-[18px] w-[18px]" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
