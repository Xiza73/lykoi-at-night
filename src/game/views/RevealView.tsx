import { useState } from "react";
import type { Player } from "../../domain/game/player";
import { isWolf as isWolfRole } from "../../domain/game/roles";
import { PrimaryButton } from "../components/PrimaryButton";
import { roleInfo } from "../roleLabels";

interface RevealViewProps {
  /** The player currently holding the phone. */
  player: Player;
  /**
   * Names of the OTHER werewolves. Only meaningful for a werewolf player, whose
   * card reveals their pack; ignored for any other role.
   */
  teammates?: string[];
  /** True when this is the last player of the reveal order. */
  isLast: boolean;
  /** Called once this player has hidden their card and passes the phone on. */
  onPass: () => void;
}

/**
 * Secret role reveal for one player. Shows a face-down card to tap/flip; once
 * flipped it reveals the player's role name, faction and power. Resets its flip
 * state whenever the player changes (keyed by the parent).
 */
export function RevealView({
  player,
  teammates = [],
  isLast,
  onPass,
}: RevealViewProps) {
  const [flipped, setFlipped] = useState(false);
  const info = roleInfo(player.role);
  const isWolf = isWolfRole(player.role);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "18px",
        textAlign: "center",
        height: "100%",
        animation: "lyk-rise .5s ease both",
      }}
    >
      <p
        style={{
          margin: 0,
          maxWidth: "30ch",
          fontSize: "14px",
          lineHeight: 1.6,
          color: "var(--lyk-muted-2)",
        }}
      >
        Pásale el teléfono a{" "}
        <strong style={{ color: "var(--lyk-ink-strong)", fontWeight: 500 }}>
          {player.name}
        </strong>
        . Que nadie mire por encima del hombro.
      </p>

      <button
        type="button"
        aria-label={
          flipped ? `Rol de ${player.name}` : `Voltear la carta de ${player.name}`
        }
        onClick={() => setFlipped(true)}
        style={{
          width: "min(74vw, 240px)",
          aspectRatio: "0.66",
          perspective: "1200px",
          cursor: flipped ? "default" : "pointer",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform .9s cubic-bezier(.2,.8,.25,1)",
            transform: `rotateY(${flipped ? 180 : 0}deg)`,
          }}
        >
          <CardFace back>
            <svg
              viewBox="0 0 100 140"
              style={{ width: "100%", height: "100%" }}
              fill="none"
              stroke="#6f6a60"
              strokeWidth="1"
              filter="url(#lykPencil)"
              aria-hidden="true"
            >
              <rect x="8" y="8" width="84" height="124" />
              <rect x="13" y="13" width="74" height="114" opacity=".5" />
              <circle cx="50" cy="60" r="20" />
              <path d="M36 74 q14 16 28 0" opacity=".6" />
              <path
                d="M42 56 q6 -7 12 0 q-6 7 -12 0z M56 56 q6 -7 12 0 q-6 7 -12 0z"
                stroke="var(--lyk-gold)"
              />
              <text
                x="50"
                y="112"
                textAnchor="middle"
                fontFamily="IM Fell English, serif"
                fontSize="9"
                fill="#6f6a60"
                stroke="none"
                letterSpacing="3"
              >
                TOCA
              </text>
            </svg>
          </CardFace>

          <CardFace tone={info.tone}>
            <div
              style={{
                fontFamily: "var(--lyk-serif)",
                fontSize: "24px",
                lineHeight: 1.1,
                color: "var(--lyk-ink-strong)",
              }}
            >
              {info.name}
            </div>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: ".24em",
                textTransform: "uppercase",
                color: info.tone,
              }}
            >
              {info.faction}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                lineHeight: 1.5,
                color: "var(--lyk-muted-2)",
                textWrap: "pretty",
              }}
            >
              {info.desc}
            </p>
            {isWolf ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  lineHeight: 1.5,
                  color: "var(--lyk-muted-2)",
                  textWrap: "pretty",
                }}
              >
                {teammates.length > 0
                  ? `Cazan contigo: ${teammates.join(", ")}`
                  : "Cazas en soledad esta noche."}
              </p>
            ) : null}
          </CardFace>
        </div>
      </button>

      <div style={{ marginTop: "auto", width: "100%" }}>
        {flipped ? (
          <PrimaryButton onClick={onPass}>
            {isLast ? "Ocultar y empezar" : "Ocultar y pasar"}
          </PrimaryButton>
        ) : null}
      </div>
    </div>
  );
}

function CardFace({
  children,
  tone,
  back = false,
}: {
  children: React.ReactNode;
  tone?: string;
  back?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backfaceVisibility: "hidden",
        transform: back ? undefined : "rotateY(180deg)",
        border: `1px solid ${back ? "#33363d" : (tone ?? "#33363d")}`,
        background: back
          ? "linear-gradient(160deg, #16191d, #0d0f12)"
          : "linear-gradient(160deg, #1a1c20, #0d0f12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: back ? 0 : "12px",
        padding: "18px",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}
