import { Boxes } from "lucide-react";

type LogoProps = {
  /** "light" renders for the dark navy sidebar; "dark" renders on light surfaces. */
  variant?: "light" | "dark";
  showText?: boolean;
  /** Extra classes for the wordmark block (used to hide it in the collapsed rail). */
  textClassName?: string;
};

export function Logo({ variant = "light", showText = true, textClassName = "" }: LogoProps) {
  const onNavy = variant === "light";
  return (
    <div className="flex items-center gap-sm whitespace-nowrap">
      <div
        className={
          onNavy
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-DEFAULT border border-white/15 bg-white/10 text-emerald-active"
            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-DEFAULT bg-deep-navy text-emerald-active"
        }
      >
        <Boxes className="h-5 w-5" strokeWidth={2.2} />
      </div>
      {showText && (
        <div className={`leading-tight ${textClassName}`}>
          <p
            className={
              onNavy
                ? "font-headline-sm text-headline-sm text-white"
                : "font-headline-sm text-headline-sm text-primary"
            }
          >
            AssetFlow
          </p>
          <p
            className={
              onNavy
                ? "font-label-caps text-[10px] uppercase tracking-wider text-white/45"
                : "font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant"
            }
          >
            Enterprise Resource
          </p>
        </div>
      )}
    </div>
  );
}
