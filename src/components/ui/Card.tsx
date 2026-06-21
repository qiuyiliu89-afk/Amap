import type { HTMLAttributes, PropsWithChildren } from "react";

export function Card({
  children,
  className = "",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <section className={`glass-card rounded-lg p-5 ${className}`} {...props}>
      {children}
    </section>
  );
}
