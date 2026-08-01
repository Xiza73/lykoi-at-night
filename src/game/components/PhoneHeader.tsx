import type { Phase } from "../../domain/game/phase";
import { PhaseChip } from "./PhaseChip";

interface PhoneHeaderProps {
  /** Uppercase label under the wordmark, e.g. "Ronda 1" or "El callejón". */
  roundLabel: string;
  /** When set, renders the phase chip on the right. */
  phase?: Phase;
}

/**
 * The phone frame's top bar: the "Lykoi at Night" wordmark with a round label,
 * and (during play) the phase chip. Matches the design's header.
 */
export function PhoneHeader({ roundLabel, phase }: PhoneHeaderProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 18px",
        borderBottom: "1px solid #1d1f24",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <span
          style={{
            fontFamily: "var(--lyk-serif)",
            fontSize: "19px",
            letterSpacing: ".02em",
            color: "var(--lyk-ink-strong)",
          }}
        >
          Lykoi{" "}
          <span style={{ fontStyle: "italic", color: "var(--lyk-gold)" }}>
            at Night
          </span>
        </span>
        <span
          style={{
            fontSize: "10.5px",
            letterSpacing: ".26em",
            textTransform: "uppercase",
            color: "var(--lyk-faint)",
          }}
        >
          {roundLabel}
        </span>
      </div>
      {phase ? <PhaseChip phase={phase} /> : null}
    </div>
  );
}
