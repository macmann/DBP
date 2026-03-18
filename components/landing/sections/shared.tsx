import { type ReactNode } from "react";

type SectionShellProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "inverted";
};

export function SectionShell({ children, className = "", tone = "default" }: SectionShellProps) {
  const base = "overflow-hidden rounded-3xl border px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10";

  const tones = {
    default: "border-neutral-200/80 bg-white",
    inverted: "border-neutral-800 bg-neutral-950 text-white",
  } as const;

  return <section className={`${base} ${tones[tone]} ${className}`.trim()}>{children}</section>;
}

type SectionHeaderProps = {
  heading: string | null;
  body?: string | null;
  align?: "left" | "center";
  headingClassName?: string;
  bodyClassName?: string;
};

export function SectionHeader({
  heading,
  body,
  align = "left",
  headingClassName = "",
  bodyClassName = "",
}: SectionHeaderProps) {
  if (!heading && !body) {
    return null;
  }

  return (
    <header className={`space-y-3 ${align === "center" ? "text-center" : "text-left"}`}>
      {heading ? (
        <h2
          className={`text-balance text-2xl font-semibold tracking-tight sm:text-3xl ${headingClassName}`.trim()}
        >
          {heading}
        </h2>
      ) : null}
      {body ? (
        <p className={`max-w-3xl text-sm leading-7 sm:text-base ${bodyClassName}`}>{body}</p>
      ) : null}
    </header>
  );
}

export function EmptyState({ message, className = "" }: { message: string; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-600 ${className}`.trim()}
    >
      {message}
    </div>
  );
}

type MediaFrameProps = {
  src?: string | null;
  alt?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackLabel?: string;
  aspectClassName?: string;
  fit?: "cover" | "contain";
};

export function MediaFrame({
  src,
  alt,
  className = "",
  imageClassName = "",
  fallbackLabel = "Media unavailable",
  aspectClassName = "aspect-[16/10]",
  fit = "cover",
}: MediaFrameProps) {
  const hasSource = typeof src === "string" && src.trim().length > 0;

  return (
    <div
      className={`relative ${aspectClassName} w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 ${className}`.trim()}
    >
      {hasSource ? (
        <img
          src={src}
          alt={alt && alt.trim().length > 0 ? alt : "Section media"}
          loading="lazy"
          className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${imageClassName}`.trim()}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-neutral-500">
          {fallbackLabel}
        </div>
      )}
    </div>
  );
}
