import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-60 active:translate-y-px motion-reduce:transition-none";

const variants: Record<Variant, string> = {
  primary:
    "btn-shine bg-burgundy text-ivory shadow-bloom hover:bg-burgundy-deep hover:shadow-bloom-lg",
  secondary:
    "btn-lift border border-stone/90 bg-surface text-ink hover:border-sage hover:text-burgundy hover:shadow-bloom",
  ghost: "btn-lift text-ink hover:bg-stone/45 hover:text-burgundy",
  danger:
    "btn-lift border border-burgundy/20 bg-white text-burgundy hover:bg-burgundy hover:text-ivory",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm sm:text-base",
  lg: "px-6 py-3 text-base",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className = "", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  },
);

/** Shared class string for Next.js Link CTAs that should match Button. */
export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className = "",
) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}
