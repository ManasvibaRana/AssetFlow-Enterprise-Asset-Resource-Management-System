"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type CalendarProps = {
  value: Date;
  onSelect: (d: Date) => void;
  showToday?: boolean;
};

/**
 * Presentational month calendar used inside popovers (DateNav, DatePicker).
 * Owns only the "which month is shown" state; selection is lifted to the parent.
 */
export function Calendar({ value, onSelect, showToday = true }: CalendarProps) {
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1, 12));

  function shiftMonth(delta: number) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1, 12));
  }

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = new Date();

  return (
    <div>
      {/* Month header */}
      <div className="mb-sm flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          className="rounded-DEFAULT p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>
        <span className="font-headline-sm text-headline-sm font-semibold text-primary">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          className="rounded-DEFAULT p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
        >
          <ChevronRight className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mb-xs grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center font-label-caps text-[10px] font-semibold uppercase text-on-surface-variant">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const cellDate = new Date(year, month, day, 12);
          const isSelected = sameDay(cellDate, value);
          const isToday = sameDay(cellDate, today);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(cellDate)}
              aria-pressed={isSelected}
              className={
                "flex h-9 items-center justify-center rounded-full font-body-sm text-body-sm transition-colors " +
                (isSelected
                  ? "bg-indigo-accent font-semibold text-white"
                  : isToday
                    ? "border border-indigo-accent text-primary hover:bg-surface-container-low"
                    : "text-on-surface hover:bg-surface-container-low")
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Footer: jump to today */}
      {showToday && (
        <div className="mt-sm border-t border-border-muted pt-sm">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              now.setHours(12, 0, 0, 0);
              onSelect(now);
            }}
            className="w-full rounded-DEFAULT py-1.5 font-label-caps text-label-caps font-semibold text-indigo-accent transition-colors hover:bg-surface-container-low"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
