import { ShieldCheck, Repeat, CalendarClock } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const features = [
  { icon: ShieldCheck, text: "Full asset lifecycle & audit trails" },
  { icon: Repeat, text: "Conflict-free allocation & transfers" },
  { icon: CalendarClock, text: "Overlap-checked resource booking" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle p-md">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border-muted bg-surface shadow-lifted md:flex-row">
        {/* Brand panel (dark navy) */}
        <div className="relative flex min-h-[300px] flex-col justify-between gap-lg bg-deep-navy p-xl text-white md:w-1/2">
          <Logo variant="light" />
          <div>
            <h2 className="font-display-lg text-display-lg font-bold">
              Track. Allocate. Maintain.
            </h2>
            <p className="mt-sm max-w-[300px] font-body-lg text-body-lg text-white/70">
              Streamline your enterprise resources and physical assets with precision.
            </p>
          </div>
          <ul className="space-y-sm">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.text} className="flex items-center gap-sm font-body-sm text-body-sm text-white/80">
                  <Icon className="h-4 w-4 shrink-0 text-emerald-active" />
                  {f.text}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Form slot */}
        <div className="flex flex-col justify-center bg-surface p-xl md:w-1/2">{children}</div>
      </div>
    </div>
  );
}
