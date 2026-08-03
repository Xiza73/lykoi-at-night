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
    description: "Cada gato recibe su rol y lo mira a solas. Nadie enseña su carta.",
  },
  {
    number: "02",
    title: "Cae la noche",
    description:
      "Todos cierran los ojos. Los Lykoi eligen presa, la Vidente investiga y el Curandero cura a un gato.",
  },
  {
    number: "03",
    title: "Amanece con una ausencia",
    description: "Se anuncia qué gato no volvió al callejón.",
  },
  {
    number: "04",
    title: "El destierro",
    description:
      "De día se discute y se vota. El gato más señalado es desterrado del callejón.",
  },
  {
    number: "05",
    title: "Y vuelve a anochecer",
    description:
      "Hasta que caiga el último Lykoi, o queden tantos Lykoi como gatos honestos.",
  },
];

/**
 * The #reglas section: intro + the 5-step "Cómo se juega" list.
 *
 * Win-condition note: this copy matches the engine's parity rule — the
 * neighborhood wins when the last Lykoi falls; the Lykoi win once they equal
 * the honest cats, at which point voting can no longer save the village.
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
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(24px, 5vw, 40px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
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
            Una ronda dura lo que dura la noche
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "14.5px",
              lineHeight: 1.7,
              color: "var(--lyk-muted-2)",
              maxWidth: "44ch",
              textWrap: "pretty",
            }}
          >
            El vecindario gana cuando cae el último Lykoi. Los Lykoi ganan
            cuando quedan tantos como gatos honestos: a partir de ahí, votar ya
            no sirve de nada.
          </p>
        </div>

        <div
          style={{
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
