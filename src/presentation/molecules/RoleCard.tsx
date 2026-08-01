import { useState } from "react";
import { type Identity, FACTION_STROKE } from "../data/identities";

interface RoleCardProps {
  identity: Identity;
}

/**
 * A single identity card in the #cartas gallery. Maldito (Lykoi) uses a
 * blood-toned frame; Vecindario cards use a neutral frame that warms to gold on
 * hover (reproducing the design's `style-hover`). The corner tag shows the
 * Salem tryal card the identity carries.
 */
export function RoleCard({ identity }: RoleCardProps) {
  const [hovered, setHovered] = useState(false);
  const isMaldito = identity.faction === "Maldito";

  const baseBorder = isMaldito ? "#3d2620" : "#2a2d33";
  const hoverBorder = isMaldito ? "var(--lyk-blood)" : "var(--lyk-gold)";
  const background = isMaldito
    ? "linear-gradient(170deg, #1a1315, #0d0f12)"
    : "linear-gradient(170deg, #16191d, #0d0f12)";
  const tagColor = isMaldito ? "var(--lyk-blood)" : "var(--lyk-gold)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? hoverBorder : baseBorder}`,
        background,
        padding: "20px 18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        aspectRatio: ".72",
        justifyContent: "space-between",
        transition: "border-color .2s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            fontSize: "9.5px",
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: tagColor,
          }}
        >
          {identity.faction}
        </span>
        <span
          style={{
            fontFamily: "var(--lyk-serif)",
            fontSize: "12px",
            fontStyle: "italic",
            color: "#4a463f",
          }}
        >
          {identity.tryal}
        </span>
      </div>

      <svg
        viewBox="0 0 24 24"
        style={{ width: "62px", height: "62px", alignSelf: "center" }}
        fill="none"
        stroke={FACTION_STROKE[identity.faction]}
        strokeWidth="1"
        filter="url(#lykPencil)"
      >
        {identity.art}
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--lyk-serif)",
            fontWeight: 400,
            fontSize: "24px",
            color: "var(--lyk-ink-strong)",
          }}
        >
          {identity.name}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "12.5px",
            lineHeight: 1.5,
            color: "var(--lyk-muted)",
          }}
        >
          {identity.description}
        </p>
      </div>
    </div>
  );
}
