import { Eyebrow } from "../atoms/Eyebrow";
import { RuleStep } from "../molecules/RuleStep";

interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Reparto en secreto",
    description:
      "Cada gato recibe su rol y cuatro cartas de juicio boca abajo. Una de ellas puede llevar la marca.",
  },
  {
    number: "02",
    title: "Cae la noche",
    description:
      "Todos cierran los ojos. Los Lykoi eligen. La Vidente mira. El Guardián se acuesta en una puerta. Nadie habla.",
  },
  {
    number: "03",
    title: "Amanece con una ausencia",
    description:
      "Se anuncia quién no volvió. Se juega con las cartas de mano: acusaciones, coartadas, conspiraciones.",
  },
  {
    number: "04",
    title: "El juicio",
    description:
      "Tres marcas y el acusado revela una carta de juicio al azar. Si sale la marca, se acabó para él. Si no, todos miran al suelo.",
  },
  {
    number: "05",
    title: "Y vuelve a anochecer",
    description:
      "Hasta que solo queden mentirosos o solo queden gatos que duermen tranquilos.",
  },
];

/**
 * The #reglas section: intro + the 5-step "Cómo se juega" list.
 *
 * Win-condition note: the original design used a parity rule (Lykoi win when
 * they equal the honest cats). This copy has been rewritten to the literal
 * Salem 1692 rule — the Lykoi only win once no honest cat is left standing.
 */
export function RulesSection() {
  return (
    <section
      id="reglas"
      style={{
        padding: "clamp(40px, 8vw, 100px) clamp(16px, 5vw, 64px)",
        borderTop: "1px solid var(--lyk-line-2)",
        background: "var(--lyk-surface-2)",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(24px, 5vw, 60px)",
        }}
      >
        <div
          style={{
            flex: "1 1 260px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <Eyebrow>Cómo se juega</Eyebrow>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--lyk-serif)",
              fontWeight: 400,
              fontSize: "clamp(30px, 7vw, 48px)",
              lineHeight: 1.03,
              color: "var(--lyk-ink-strong)",
            }}
          >
            Una ronda
            <br />
            dura lo que
            <br />
            dura la noche
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "14.5px",
              lineHeight: 1.7,
              color: "var(--lyk-muted-2)",
              maxWidth: "34ch",
              textWrap: "pretty",
            }}
          >
            El vecindario gana cuando los tres Lykoi han sido juzgados. Los Lykoi
            solo se quedan el callejón cuando ya no queda un solo gato honesto en
            pie: cuando el último ronroneo verdadero se ha apagado, no hay quien
            los juzgue.
          </p>
        </div>

        <div
          style={{
            flex: "2 1 380px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {steps.map((step, index) => (
            <RuleStep
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              last={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
