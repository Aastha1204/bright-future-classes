import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary-light text-primary",
        hot: "bg-red-600 text-white shadow-glow dark:bg-red-400 dark:text-slate-950",
        warm: "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/40 dark:text-amber-300",
        cold: "bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/30 dark:text-slate-300",
        outline: "border border-line text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function LeadBadge({ badge }: { badge: "HOT" | "WARM" | "COLD" }) {
  const v = badge === "HOT" ? "hot" : badge === "WARM" ? "warm" : "cold";
  return <Badge variant={v}>{badge === "HOT" ? "🔥 HOT" : badge}</Badge>;
}
