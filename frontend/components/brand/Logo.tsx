import { Boxes } from "lucide-react";

type LogoProps = {
  /**
   * "light" = always on a dark ground (navy auth panel).
   * "dark"  = always on a light ground.
   * "adaptive" = follows the app theme (light sidebar in light mode, navy in dark).
   */
  variant?: "light" | "dark" | "adaptive";
  showText?: boolean;
  textClassName?: string;
};

export function Logo({ variant = "light", showText = true, textClassName = "" }: LogoProps) {
  const box =
    variant === "light"
      ? "border border-white/15 bg-white/10 text-emerald-active"
      : variant === "dark"
        ? "bg-deep-navy text-emerald-active"
        : "bg-deep-navy text-emerald-active dark:border dark:border-white/15 dark:bg-white/10";

  const title =
    variant === "light" ? "text-white" : "text-primary"; // text-primary flips with theme
  const subtitle =
    variant === "light" ? "text-white/45" : "text-on-surface-variant";

  return (
    <div className="flex items-center gap-sm whitespace-nowrap">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-DEFAULT ${box}`}>
        <Boxes className="h-5 w-5" strokeWidth={2.2} />
      </div>
      {showText && (
        <div className={`leading-tight ${textClassName}`}>
          <p className={`font-headline-sm text-headline-sm ${title}`}>AssetFlow</p>
          <p className={`font-label-caps text-[10px] uppercase tracking-wider ${subtitle}`}>Enterprise Resource</p>
        </div>
      )}
    </div>
  );
}
