import { useState } from "react";
import type { Player } from "../../domain/game/player";
import type { TryalDeck } from "../../domain/game/tryal";
import { isWitch } from "../../domain/game/roles";
import { PrimaryButton } from "../components/PrimaryButton";
import { tryalLabel, tryalTone } from "../tryalLabels";

interface RevealViewProps {
  /** The player currently holding the phone. */
  player: Player;
  /** That player's tryal deck — shown face-up to themselves, as in Salem. */
  tryal: TryalDeck;
  /** True when this is the last player of the reveal order. */
  isLast: boolean;
  /** Called once this player has hidden their card and passes the phone on. */
  onPass: () => void;
}

/**
 * Secret role reveal for one player. Shows a face-down card to tap/flip; once
 * flipped it reveals the player's faction and their own tryal cards. Resets its
 * flip state whenever the player changes (keyed by the parent).
 */
export function RevealView({ player, tryal, isLast, onPass }: RevealViewProps) {
  const [flipped, setFlipped] = useState(false);
  const witch = isWitch(player.role);
  const tone = witch ? "var(--lyk-blood-bright)" : "var(--lyk-gold)";
  const faction = witch ? "Lykoi · Maldito" : "Vecindario";

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

          <CardFace tone={tone}>
            <div
              style={{
                fontFamily: "var(--lyk-serif)",
                fontSize: "26px",
                lineHeight: 1.1,
                color: "var(--lyk-ink-strong)",
              }}
            >
              {player.name}
            </div>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: ".24em",
                textTransform: "uppercase",
                color: tone,
              }}
            >
              {faction}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {tryal.cards.map((card, index) => (
                <span
                  key={index}
                  style={{
                    padding: "4px 6px",
                    border: `1px solid ${tryalTone(card)}`,
                    fontSize: "9px",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: tryalTone(card),
                    whiteSpace: "nowrap",
                  }}
                >
                  {tryalLabel(card)}
                </span>
              ))}
            </div>
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
