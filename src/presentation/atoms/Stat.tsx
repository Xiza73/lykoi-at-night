import type { ReactNode } from "react";

interface StatProps {
  /** The large serif value (e.g. "12"), may include a small suffix node. */
  value: ReactNode;
  /** The uppercase caption below the value (e.g. "Gatos"). */
  label: string;
}

/**
 * A single hero stat: large serif value over an uppercase caption.
 * Used in the hero's stats row (12 Gatos, 3 Malditos, 25 min, 1 Dispositivo).
 */
export function Stat({ value, label }: StatProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span
        style={{
          fontFamily: "var(--lyk-serif)",
          fontSize: "clamp(24px, 6vw, 32px)",
          color: "var(--lyk-ink-strong)",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "11px",
          letterSpacing: ".24em",
          textTransform: "uppercase",
          color: "var(--lyk-faint)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
