import { GameScreen } from "../../game/GameScreen";
import type { Shuffle } from "../../domain/game/shuffle";
import { Eyebrow } from "../atoms/Eyebrow";

interface PartidaSectionProps {
  /** Forwarded to GameScreen; tests inject a deterministic shuffle. */
  shuffle?: Shuffle;
}

/**
 * The #partida section: an intro column plus the interactive pass-and-play game
 * inside the phone frame. Pure presentation — all game state lives in
 * GameScreen, which owns the only randomness boundary.
 */
export function PartidaSection({ shuffle }: PartidaSectionProps) {
  return (
    <section
      id="partida"
      style={{
        padding: "clamp(34px, 7vw, 90px) clamp(14px, 4vw, 56px)",
        background: "linear-gradient(180deg, #0b0c0d, #101215 40%, #0b0c0d)",
        borderTop: "1px solid var(--lyk-line-2)",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(28px, 4vw, 56px)",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            flex: "1 1 320px",
            maxWidth: "460px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Eyebrow>Prototipo jugable</Eyebrow>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--lyk-serif)",
              fontWeight: 400,
              fontSize: "clamp(30px, 7vw, 46px)",
              lineHeight: 1.05,
              color: "var(--lyk-ink-strong)",
            }}
          >
            La noche corre en un solo teléfono
          </h2>
          <p
            style={{
              margin: 0,
              maxWidth: "44ch",
              fontSize: "15px",
              lineHeight: 1.7,
              color: "var(--lyk-muted)",
              textWrap: "pretty",
            }}
          >
            Reparte los roles en secreto y pasa el teléfono de gato en gato. La
            app lleva las marcas, los juicios y los cadáveres. Tú solo tienes que
            mentir bien.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "18px",
              border: "1px solid var(--lyk-line)",
              background: "rgba(19,21,24,.7)",
              textAlign: "left",
              maxWidth: "420px",
            }}
          >
            <Eyebrow style={{ letterSpacing: ".28em" }}>Cómo se pasa</Eyebrow>
            {[
              "Anota a cada gato y elige cuántos Lykoi se esconden.",
              "Cada uno mira su rol a solas y pasa el teléfono.",
              "Señalen en voz alta; con siete marcas empieza el juicio.",
            ].map((line) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  gap: "10px",
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                  color: "var(--lyk-muted)",
                }}
              >
                <span style={{ color: "#4a463f" }}>—</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: "0 1 430px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <GameScreen shuffle={shuffle} />
        </div>
      </div>
    </section>
  );
}
