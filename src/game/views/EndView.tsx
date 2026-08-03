import type { Outcome } from "../../domain/game/game";
import { PrimaryButton } from "../components/PrimaryButton";

interface EndViewProps {
  winner: Outcome;
  onReset: () => void;
}

/**
 * The end screen: winner banner with a face and the victory copy, plus an
 * "Otra noche" reset. Town wins when no Lykoi remain; Lykoi win once they reach
 * parity with the town.
 */
export function EndView({ winner, onReset }: EndViewProps) {
  const townWon = winner === "town";
  const tone = townWon ? "var(--lyk-gold)" : "var(--lyk-blood-bright)";
  const title = townWon
    ? "El vecindario duerme tranquilo"
    : "Los Lykoi se quedan el callejón";
  const text = townWon
    ? "El último Lykoi cayó. Nadie habla de lo que costó."
    : "Ya son tantos como vosotros. Votar dejó de significar algo.";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        height: "100%",
        textAlign: "center",
        animation: "lyk-rise .6s ease both",
      }}
    >
      <svg
        viewBox="0 0 120 120"
        style={{ width: "140px", height: "140px" }}
        fill="none"
        stroke={tone}
        strokeWidth="1.1"
        filter="url(#lykPencil)"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="44" />
        <path d="M38 52 q10 -12 20 0 q-10 12 -20 0z M62 52 q10 -12 20 0 q-10 12 -20 0z" />
        <path d="M48 52 v0 M72 52 v0" strokeWidth="3" strokeLinecap="round" />
        <path d="M44 80 q16 12 32 0" />
      </svg>
      <div
        style={{
          fontFamily: "var(--lyk-serif)",
          fontSize: "32px",
          lineHeight: 1.1,
          color: "var(--lyk-ink-strong)",
        }}
      >
        {title}
      </div>
      <p
        style={{
          margin: 0,
          maxWidth: "28ch",
          fontSize: "14px",
          lineHeight: 1.6,
          color: "var(--lyk-muted-2)",
        }}
      >
        {text}
      </p>
      <PrimaryButton variant="ghost" onClick={onReset}>
        Otra noche
      </PrimaryButton>
    </div>
  );
}
