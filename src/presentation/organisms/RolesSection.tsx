import { Eyebrow } from "../atoms/Eyebrow";
import { RoleCard } from "../molecules/RoleCard";
import { HandCard } from "../molecules/HandCard";
import { roles } from "../data/roles";
import { handCards } from "../data/handCards";

/**
 * The #cartas section: a heading, the 9-role gallery grid, and the
 * "Cartas de mano" row beneath it.
 */
export function RolesSection() {
  return (
    <section
      id="cartas"
      style={{
        padding: "clamp(40px, 8vw, 100px) clamp(16px, 5vw, 64px)",
        borderTop: "1px solid var(--lyk-line-2)",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(26px, 5vw, 46px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "620px",
          }}
        >
          <Eyebrow>Los roles</Eyebrow>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--lyk-serif)",
              fontWeight: 400,
              fontSize: "clamp(32px, 8vw, 54px)",
              lineHeight: 1.02,
              color: "var(--lyk-ink-strong)",
            }}
          >
            Nueve maneras
            <br />
            de no ser tú mismo
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 232px), 1fr))",
            gap: "clamp(12px, 2.2vw, 20px)",
          }}
        >
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            marginTop: "clamp(14px, 3vw, 30px)",
          }}
        >
          <Eyebrow>Cartas de mano</Eyebrow>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 190px), 1fr))",
              gap: "clamp(12px, 2vw, 18px)",
            }}
          >
            {handCards.map((card) => (
              <HandCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
