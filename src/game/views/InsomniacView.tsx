import { useState } from "react";
import type { Game } from "../../domain/game/game";
import { nightFootsteps } from "../../domain/game/game";
import { PrimaryButton } from "../components/PrimaryButton";

interface InsomniacViewProps {
  game: Game;
  onContinue: () => void;
}

/** Spanish rendering of a footstep count, singular-aware. */
function footstepsLabel(count: number): string {
  if (count === 1) {
    return "un paso";
  }
  return `${count} pasos`;
}

/**
 * The private, two-beat dawn gate for El Insomne. First it hands them the phone;
 * then it whispers how many Lykoi still prowl — the count only, never who. It is
 * ALWAYS shown while the insomniac role is in the game (even if dead), matching
 * how the night turns are gated by role-in-game so nothing leaks.
 */
export function InsomniacView({ game, onContinue }: InsomniacViewProps) {
  const [revealed, setRevealed] = useState(false);
  const count = nightFootsteps(game);

  if (!revealed) {
    return (
      <Frame
        title="El Insomne"
        body="Pásale el teléfono a El Insomne. Que los demás aparten la mirada."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={() => setRevealed(true)}>
            Ya lo tengo
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  return (
    <Frame
      title="Pasos en el tejado"
      body={`Anoche oíste ${footstepsLabel(count)} en el tejado.`}
    >
      <div
        style={{
          padding: "12px 14px",
          borderLeft: "2px solid var(--lyk-gold)",
          background: "rgba(255,255,255,.03)",
          fontSize: "13px",
          lineHeight: 1.5,
          color: "var(--lyk-ink)",
        }}
      >
        Esos son los Lykoi que aún rondan.
      </div>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onContinue}>Entendido</PrimaryButton>
      </div>
    </Frame>
  );
}

/** Shared scaffold: title, body copy and a column of children. Mirrors NightView. */
function Frame({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        animation: "lyk-rise .4s ease both",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--lyk-serif)",
            fontWeight: 400,
            fontSize: "clamp(24px, 6.5vw, 30px)",
            lineHeight: 1.1,
            color: "var(--lyk-ink-strong)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            lineHeight: 1.55,
            color: "var(--lyk-muted-2)",
            textWrap: "pretty",
          }}
        >
          {body}
        </p>
      </div>
      {children}
    </div>
  );
}
