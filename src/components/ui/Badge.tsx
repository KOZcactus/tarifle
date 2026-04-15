import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

// Tint opacity '10' yerine '15' kullanıyorduk — AA için kontrast yetersizdi
// (text-primary #b34016 on bg-primary/15 = 3.93 < 4.5). Tint'i hafifleterek
// text rengiyle arasındaki farkı artırdık; "chip" hissi korunuyor,
// kontrast AA'yı geçiyor (4.5+).
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-bg-elevated text-text-muted",
  primary: "bg-primary/10 text-primary",
  success: "bg-accent-green/10 text-accent-green",
  warning: "bg-warning/10 text-warning",
  info: "bg-accent-blue/10 text-accent-blue",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
