import { useState } from "react";
import { Stat } from "../atoms/Stat";

/** A hero CTA link with the design's hover treatment. */
function CtaLink({
  href,
  variant,
  onClick,
  children,
}: {
  href: string;
  variant: "solid" | "ghost";
  onClick?: (event: React.MouseEvent) => void;
  children: string;
}) {
  const [hovered, setHovered] = useState(false);
  const solid = variant === "solid";

  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "15px 26px",
        fontSize: "14px",
        letterSpacing: ".16em",
        textTransform: "uppercase",
        fontWeight: solid ? 500 : 300,
        border: solid
          ? `1px solid ${hovered ? "var(--lyk-gold-bright)" : "var(--lyk-gold)"}`
          : `1px solid ${hovered ? "var(--lyk-muted-2)" : "#3a3833"}`,
        color: solid
          ? "var(--lyk-bg)"
          : hovered
            ? "var(--lyk-ink-strong)"
            : "#cfc8bb",
        background: solid
          ? hovered
            ? "var(--lyk-gold-bright)"
            : "var(--lyk-gold)"
          : "transparent",
        transition: "border-color .2s, color .2s, background .2s",
      }}
    >
      {children}
    </a>
  );
}

/**
 * The landing hero: eyebrow, title, tagline, CTAs, stats row and the decorative
 * moon/pencil SVG. Copy and art are reproduced from the design.
 */
export function Hero() {
  // The primary CTA jumps to the interactive game section.
  const handleOpenGame = (event: React.MouseEvent) => {
    event.preventDefault();
    document
      .getElementById("partida")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: "92svh",
        display: "grid",
        placeItems: "center",
        padding: "clamp(28px, 7vw, 80px) clamp(18px, 5vw, 64px)",
        background:
          "radial-gradient(120% 90% at 50% 8%, #1a1d21 0%, #0b0c0d 62%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <svg
          viewBox="0 0 400 400"
          style={{
            position: "absolute",
            left: "50%",
            top: "clamp(40px, 9vw, 90px)",
            transform: "translateX(-50%)",
            width: "min(78vw, 460px)",
            opacity: 0.5,
            animation: "lyk-breathe 11s ease-in-out infinite",
          }}
          fill="none"
          stroke="#b9b2a4"
          strokeWidth="1.1"
          filter="url(#lykPencil)"
        >
          <circle cx="200" cy="200" r="150" />
          <circle
            cx="200"
            cy="200"
            r="150"
            strokeDasharray="3 11"
            opacity=".6"
            transform="rotate(12 200 200)"
          />
          <path
            d="M110 250 L150 190 M130 268 L186 176 M158 282 L228 168 M192 288 L266 174 M232 284 L292 194 M268 268 L312 216"
            opacity=".28"
          />
          <circle cx="152" cy="158" r="22" opacity=".35" />
          <circle cx="246" cy="232" r="31" opacity=".3" />
          <circle cx="196" cy="112" r="13" opacity=".3" />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11,12,13,0) 30%, #0b0c0d 88%)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          textAlign: "center",
          maxWidth: "900px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(16px, 2.6vw, 26px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "clamp(10px, 2.6vw, 12px)",
            letterSpacing: ".42em",
            textTransform: "uppercase",
            color: "var(--lyk-muted-2)",
          }}
        >
          <span
            style={{
              width: "clamp(20px, 8vw, 54px)",
              height: "1px",
              background: "#4a463f",
            }}
          />
          Juego de deducción social
          <span
            style={{
              width: "clamp(20px, 8vw, 54px)",
              height: "1px",
              background: "#4a463f",
            }}
          />
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: "var(--lyk-serif)",
            fontWeight: 400,
            fontSize: "clamp(52px, 15vw, 148px)",
            lineHeight: 0.86,
            letterSpacing: "-.01em",
            color: "var(--lyk-ink-strong)",
            textShadow: "0 0 60px rgba(217,164,76,.14)",
          }}
        >
          Lykoi
          <br />
          <span style={{ fontStyle: "italic", color: "var(--lyk-gold)" }}>
            at Night
          </span>
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: "42ch",
            fontSize: "clamp(15px, 3.6vw, 19px)",
            lineHeight: 1.62,
            color: "var(--lyk-muted)",
            textWrap: "pretty",
          }}
        >
          Doce gatos comparten el mismo callejón. Tres de ellos dejaron de
          ronronear hace semanas. Nadie lo ha notado todavía.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            marginTop: "6px",
          }}
        >
          <CtaLink href="#partida" variant="solid" onClick={handleOpenGame}>
            Abrir la partida
          </CtaLink>
          <CtaLink href="#cartas" variant="ghost">
            Ver las cartas
          </CtaLink>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "clamp(18px, 6vw, 46px)",
            marginTop: "clamp(14px, 4vw, 28px)",
            paddingTop: "clamp(18px, 4vw, 30px)",
            borderTop: "1px solid var(--lyk-line)",
            width: "min(100%, 620px)",
          }}
        >
          <Stat value="12" label="Gatos" />
          <Stat value="3" label="Malditos" />
          <Stat
            value={
              <>
                25<span style={{ fontSize: "15px" }}> min</span>
              </>
            }
            label="Duración"
          />
          <Stat value="1" label="Dispositivo c/u" />
        </div>
      </div>
    </section>
  );
}
