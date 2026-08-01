import type { Phase } from "../../domain/game/phase";
import { phaseLabel, phaseTone } from "./phaseStyle";

interface PhaseChipProps {
  phase: Phase;
}

/**
 * The header chip showing the current phase, with a flickering dot — matches
 * the design's phase indicator.
 */
export function PhaseChip({ phase }: PhaseChipProps) {
  const tone = phaseTone(phase);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 12px",
        border: "1px solid #2a2d33",
        color: tone,
        fontSize: "11px",
        letterSpacing: ".2em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: tone,
          animation: "lyk-flicker 3.4s infinite",
        }}
      />
      {phaseLabel(phase)}
    </div>
  );
}
