interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  accent?: boolean;
}

export default function Avatar({ initials, size = "md", accent = false }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-medium font-mono-plex flex-shrink-0 transition-all`}
      style={{
        background: accent
          ? "hsla(158, 60%, 68%, 0.15)"
          : "hsl(var(--secondary))",
        color: accent ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        border: `1px solid ${accent ? "hsla(158, 60%, 68%, 0.3)" : "hsl(var(--border))"}`,
      }}
    >
      {initials}
    </div>
  );
}
