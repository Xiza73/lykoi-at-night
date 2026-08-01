import { useState, type CSSProperties, type ReactNode } from "react";

interface PrimaryButtonProps {
  onClick: () => void;
  children: ReactNode;
  /** "gold" is the solid CTA; "ghost" is the outlined secondary action. */
  variant?: "gold" | "ghost";
  disabled?: boolean;
  style?: CSSProperties;
}

/**
 * The phone-frame action button, reproducing the design's solid gold CTA and
 * its outlined "ghost" variant (with the same hover treatment).
 */
export function PrimaryButton({
  onClick,
  children,
  variant = "gold",
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const [hovered, setHovered] = useState(false);
  const gold = variant === "gold";

  const base: CSSProperties = {
    padding: "15px",
    fontFamily: "var(--lyk-sans)",
    fontSize: "13px",
    letterSpacing: ".18em",
    textTransform: "uppercase",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "border-color .2s, color .2s, background .2s, opacity .2s",
    opacity: disabled ? 0.4 : 1,
  };

  const skin: CSSProperties = gold
    ? {
        background:
          hovered && !disabled
            ? "var(--lyk-gold-bright)"
            : "var(--lyk-gold)",
        border: "1px solid var(--lyk-gold)",
        color: "var(--lyk-bg)",
      }
    : {
        background: "none",
        border: `1px solid ${hovered && !disabled ? "var(--lyk-gold)" : "#3a3833"}`,
        color: hovered && !disabled ? "var(--lyk-gold)" : "#cfc8bb",
      };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...skin, ...style }}
    >
      {children}
    </button>
  );
}
