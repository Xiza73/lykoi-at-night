import type { ActionCard, ActionColor } from "../data/actionCards";

interface HandCardProps {
  card: ActionCard;
  color: ActionColor;
}

/** Per-color accent used for the card name and border tint. */
const COLOR_ACCENT: Record<ActionColor, string> = {
  rojas: "var(--lyk-blood)",
  azules: "var(--lyk-night)",
  negras: "var(--lyk-faint)",
  verdes: "var(--lyk-moss)",
};

/**
 * A Salem action-card tile. The card name takes the group's color accent; the
 * effect describes the real Salem behavior and a muted "Salem · <card>" tag
 * keeps the mapping to the original card visible.
 */
export function HandCard({ card, color }: HandCardProps) {
  const accent = COLOR_ACCENT[color];

  return (
    <div
      style={{
        border: `1px solid var(--lyk-line)`,
        borderTop: `2px solid ${accent}`,
        background: "var(--lyk-surface)",
        padding: "16px 18px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--lyk-serif)",
          fontSize: "12.5px",
          fontStyle: "italic",
          color: "var(--lyk-muted)",
        }}
      >
        {card.quote}
      </span>
      <h4
        style={{
          margin: 0,
          fontFamily: "var(--lyk-serif)",
          fontWeight: 400,
          fontSize: "20px",
          color: accent,
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
        {card.effect}
      </p>
      <span
        style={{
          marginTop: "2px",
          fontSize: "9px",
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "var(--lyk-faint)",
        }}
      >
        Salem · {card.salem}
      </span>
    </div>
  );
}
