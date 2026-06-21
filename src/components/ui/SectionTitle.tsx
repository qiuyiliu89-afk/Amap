interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold text-white md:text-4xl">{title}</h1>
      {description ? <p className="mt-3 text-[15px] leading-7 text-slate-300">{description}</p> : null}
    </div>
  );
}
