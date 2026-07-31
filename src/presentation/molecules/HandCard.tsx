import type { HandCard as HandCardData } from "../data/handCards";

interface HandCardProps {
  card: HandCardData;
}

/**
 * A "Carta de mano" tile. Gold-toned cards use the neutral surface; blood-toned
 * cards (Presagio) get a warmer frame and background, matching the design.
 */
export function HandCard({ card }: HandCardProps) {
  const isBlood = card.tone === "blood";

  return (
    <div
      style={{
        border: `1px solid ${isBlood ? "#3d2620" : "var(--lyk-line)"}`,
        background: isBlood ? "#14100f" : "var(--lyk-surface)",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <span
        style={{
          fontSize: "9.5px",
          letterSpacing: ".22em",
          textTransform: "uppercase",
          color: isBlood ? "var(--lyk-blood)" : "var(--lyk-gold)",
        }}
      >
        {card.kind}
      </span>
      <h4
        style={{
          margin: 0,
          fontFamily: "var(--lyk-serif)",
          fontWeight: 400,
          fontSize: "20px",
          color: "var(--lyk-ink-strong)",
        }}
      >
        {card.name}
      </h4>
      <p
        style={{
          margin: 0,
          fontSize: "12.5px",
          lineHeight: 1.5,
          color: "var(--lyk-muted-2)",
        }}
      >
        {card.description}
      </p>
    </div>
  );
}
