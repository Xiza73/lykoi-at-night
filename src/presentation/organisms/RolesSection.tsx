import { Eyebrow } from "../atoms/Eyebrow";
import { RoleCard } from "../molecules/RoleCard";
import { roles } from "../data/roles";

/**
 * The #cartas section: the nine-role gallery. Centered and mobile-first — a
 * single column on narrow screens, a multi-column grid on desktop. Roles the
 * engine does not support yet are dimmed and badged "Próximamente".
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
            alignItems: "center",
            textAlign: "center",
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
              "repeat(auto-fit, minmax(min(100%, 232px), 1fr))",
            justifyContent: "center",
            gap: "clamp(12px, 2.2vw, 20px)",
          }}
        >
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      </div>
    </section>
  );
}
