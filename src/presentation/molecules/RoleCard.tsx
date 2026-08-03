import { useState } from "react";
import { type Role, FACTION_STROKE } from "../data/roles";

interface RoleCardProps {
  role: Role;
}

/**
 * A single role card in the #cartas gallery. Maldito roles use a blood-toned
 * frame; Vecindario roles use a neutral frame that warms to gold on hover
 * (reproducing the design's `style-hover`). The corner tag shows the faction
 * plus its deck count (e.g. "Maldito · x3").
 *
 * Roles the engine does not support yet are dimmed and carry a "Próximamente"
 * corner badge; implemented roles render at full strength.
 */
export function RoleCard({ role }: RoleCardProps) {
  const [hovered, setHovered] = useState(false);
  const isMaldito = role.faction === "Maldito";

  const baseBorder = isMaldito ? "#3d2620" : "#2a2d33";
  const hoverBorder = isMaldito ? "var(--lyk-blood)" : "var(--lyk-gold)";
  const background = isMaldito
    ? "linear-gradient(170deg, #1a1315, #0d0f12)"
    : "linear-gradient(170deg, #16191d, #0d0f12)";
  const tagColor = isMaldito ? "var(--lyk-blood)" : "var(--lyk-gold)";

  const factionLabel = role.count
    ? `${role.faction} · x${role.count}`
    : role.faction;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        border: `1px solid ${hovered ? hoverBorder : baseBorder}`,
        background,
        padding: "20px 18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        aspectRatio: ".72",
        justifyContent: "space-between",
        opacity: role.implemented ? 1 : 0.55,
        transition: "border-color .2s, opacity .2s",
      }}
    >
      {!role.implemented && (
        <span
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            padding: "3px 8px",
            fontSize: "8.5px",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--lyk-faint)",
            border: "1px solid var(--lyk-line)",
            background: "var(--lyk-bg)",
          }}
        >
          Próximamente
        </span>
      )}

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
          {factionLabel}
        </span>
      </div>

      <svg
        viewBox="0 0 24 24"
        style={{ width: "62px", height: "62px", alignSelf: "center" }}
        fill="none"
        stroke={FACTION_STROKE[role.faction]}
        strokeWidth="1"
        filter="url(#lykPencil)"
      >
        {role.art}
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
          {role.name}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "12.5px",
            lineHeight: 1.5,
            color: "var(--lyk-muted)",
          }}
        >
          {role.description}
        </p>
      </div>
    </div>
  );
}
