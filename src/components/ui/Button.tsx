import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-aqua-400 to-sky-400 text-ink-950 shadow-glow hover:brightness-110",
  secondary:
    "border border-aqua-400/30 bg-aqua-400/10 text-aqua-100 hover:bg-aqua-400/16",
  ghost: "text-slate-200 hover:bg-white/8",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
