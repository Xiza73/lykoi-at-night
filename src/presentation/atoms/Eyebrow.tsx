import type { CSSProperties, ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  /** Letter-spacing preset. Section labels use "wide"; hero uses "wider". */
  spacing?: "wide" | "wider";
  style?: CSSProperties;
}

/**
 * Uppercase, letter-spaced label used to introduce sections (e.g. "Los roles",
 * "Cómo se juega", "Cartas de mano").
 */
export function Eyebrow({ children, spacing = "wide", style }: EyebrowProps) {
  return (
    <div
      style={{
        fontSize: "11px",
        letterSpacing: spacing === "wider" ? ".42em" : ".34em",
        textTransform: "uppercase",
        color: "var(--lyk-faint)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
