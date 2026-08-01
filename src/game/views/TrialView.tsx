import type { Player } from "../../domain/game/player";
import type { TryalDeck } from "../../domain/game/tryal";
import { PrimaryButton } from "../components/PrimaryButton";
import { tryalLabel, tryalTone } from "../tryalLabels";

interface TrialViewProps {
  /** The player currently on trial. */
  accused: Player;
  /** Their tryal deck; revealed flags drive the outcome copy. */
  tryal: TryalDeck;
  /** Reveal one face-down card by index. */
  onReveal: (index: number) => void;
  /** Continue once the trial has resolved (a card was revealed). */
  onContinue: () => void;
  /** Whether the game ended as a result of this reveal. */
  gameEnded: boolean;
}

/**
 * The trial: the accused's tryal deck shown face-down. Tapping a card reveals
 * it; a witch card (or the last remaining card) ends the accused. Because the
 * domain flips onTrial back to null after a reveal, this view derives the
 * "resolved" state from whether any card is now revealed.
 */
export function TrialView({
  accused,
  tryal,
  onReveal,
  onContinue,
  gameEnded,
}: TrialViewProps) {
  const resolved = tryal.revealed.some((flag) => flag);
  const survived = accused.alive;

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
          El juicio de {accused.name}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            lineHeight: 1.55,
            color: "var(--lyk-muted-2)",
          }}
        >
          {resolved
            ? "La carta está sobre la mesa."
            : "Que revele una carta de juicio. Si sale la marca, se acabó para él."}
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {tryal.cards.map((card, index) => {
          const isRevealed = tryal.revealed[index];
          return (
            <button
              key={index}
              type="button"
              aria-label={
                isRevealed
                  ? `Carta revelada: ${tryalLabel(card)}`
                  : `Revelar carta ${index + 1}`
              }
              disabled={resolved}
              onClick={() => onReveal(index)}
              style={{
                flex: "1 1 0",
                maxWidth: "110px",
                aspectRatio: ".68",
                border: `1px solid ${isRevealed ? tryalTone(card) : "#33363d"}`,
                background: "linear-gradient(165deg, #17191d, #0d0f12)",
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: resolved ? "default" : "pointer",
                textAlign: "center",
              }}
            >
              {isRevealed ? (
                <span
                  style={{
                    fontFamily: "var(--lyk-serif)",
                    fontSize: "15px",
                    lineHeight: 1.1,
                    color: tryalTone(card),
                  }}
                >
                  {tryalLabel(card)}
                </span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  style={{ width: "34px", height: "34px" }}
                  fill="none"
                  stroke="#6f6a60"
                  strokeWidth="1.1"
                  filter="url(#lykPencilSoft)"
                  aria-hidden="true"
                >
                  <rect x="4" y="3" width="16" height="18" />
                  <path d="M9 12 h6 M12 9 v6" opacity=".6" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {resolved ? (
        <div
          style={{
            padding: "12px 14px",
            borderLeft: `2px solid ${survived ? "var(--lyk-gold)" : "var(--lyk-blood-bright)"}`,
            background: "rgba(255,255,255,.03)",
            fontSize: "13px",
            lineHeight: 1.5,
            color: "var(--lyk-ink)",
          }}
        >
          {survived
            ? `${accused.name} sobrevive al juicio. El callejón vuelve a murmurar.`
            : `${accused.name} cae. La marca estaba ahí.`}
        </div>
      ) : null}

      <div style={{ marginTop: "auto" }}>
        {resolved ? (
          <PrimaryButton onClick={onContinue}>
            {gameEnded ? "Ver el desenlace" : "Volver al callejón"}
          </PrimaryButton>
        ) : null}
      </div>
    </div>
  );
}
