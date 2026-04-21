interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  accent?: boolean;
}

function getColorFromInitials(initials: string) {
  const colors = [
    { bg: "hsla(214,89%,60%,0.18)", color: "hsl(214,89%,65%)", border: "hsla(214,89%,60%,0.35)" },
    { bg: "hsla(262,80%,65%,0.18)", color: "hsl(262,70%,70%)", border: "hsla(262,80%,65%,0.35)" },
    { bg: "hsla(340,75%,60%,0.18)", color: "hsl(340,70%,65%)", border: "hsla(340,75%,60%,0.35)" },
    { bg: "hsla(158,55%,55%,0.18)", color: "hsl(158,55%,60%)", border: "hsla(158,55%,55%,0.35)" },
    { bg: "hsla(35,90%,60%,0.18)",  color: "hsl(35,85%,65%)",  border: "hsla(35,90%,60%,0.35)" },
    { bg: "hsla(190,75%,55%,0.18)", color: "hsl(190,70%,60%)", border: "hsla(190,75%,55%,0.35)" },
  ];
  const code = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  return colors[code % colors.length];
}

export default function Avatar({ initials, size = "md", accent = false }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };

  const palette = getColorFromInitials(initials);

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 transition-all select-none`}
      style={{
        background: accent ? "hsl(var(--primary))" : palette.bg,
        color: accent ? "hsl(var(--primary-foreground))" : palette.color,
        border: `1.5px solid ${accent ? "hsl(var(--primary))" : palette.border}`,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}
