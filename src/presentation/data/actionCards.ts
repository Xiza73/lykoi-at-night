/**
 * The Salem 1692 action-card deck, retold cat-flavored for "Lykoi at Night".
 *
 * Salem's variety lives here, in a deck grouped by four card colors. Every card
 * keeps its REAL Salem effect (verified from the rules) and carries a muted
 * "Salem · <card>" reference tag so the mapping stays honest.
 */

export type ActionColor = "rojas" | "azules" | "negras" | "verdes";

export interface ActionCard {
  id: string;
  /** Cat-flavored card name. */
  name: string;
  /** Short in-world quote. */
  quote: string;
  /** The real Salem effect. */
  effect: string;
  /** The real Salem card this maps to (English name), shown as a muted tag. */
  salem: string;
}

export interface ActionGroup {
  color: ActionColor;
  /** Section label shown above the group (e.g. "Rojas"). */
  label: string;
  /** One-line note on how the color behaves. */
  note: string;
  cards: ActionCard[];
}

export const actionGroups: ActionGroup[] = [
  {
    color: "rojas",
    label: "Rojas",
    note: "Acusaciones. A las 7 marcas, empieza el juicio.",
    cards: [
      {
        id: "acusacion",
        name: "Acusación",
        quote: '"Fue él, lo vi"',
        effect: "Pon una marca de sospecha sobre un gato.",
        salem: "Accusation",
      },
      {
        id: "testigo",
        name: "Testigo",
        quote: '"Yo lo vi todo"',
        effect: "Otra marca de sospecha.",
        salem: "Witness",
      },
      {
        id: "evidencia",
        name: "Evidencia",
        quote: '"Pelos en la escena"',
        effect: "Otra marca de sospecha.",
        salem: "Evidence",
      },
    ],
  },
  {
    color: "azules",
    label: "Azules",
    note: "Se quedan sobre la mesa.",
    cards: [
      {
        id: "coartada",
        name: "Coartada",
        quote: '"La caja"',
        effect: "Anula una acusación.",
        salem: "Alibi",
      },
      {
        id: "refugio",
        name: "Refugio",
        quote: '"El regazo tibio"',
        effect: "Protege a un gato de morir esa noche.",
        salem: "Asylum",
      },
      {
        id: "lazos",
        name: "Lazos de Camada",
        quote: '"Atados por la cola"',
        effect: "Liga a dos gatos: si uno cae, cae el otro.",
        salem: "Matchmaker",
      },
      {
        id: "piedad",
        name: "Piedad",
        quote: '"Nadie toca al santo"',
        effect: "Bloquea efectos sobre un gato; no puedes jugarla sobre ti.",
        salem: "Piety",
      },
      {
        id: "cepo",
        name: "Cepo",
        quote: '"Atrapado en la gatera"',
        effect: "El gato pierde su turno.",
        salem: "Stocks",
      },
    ],
  },
  {
    color: "negras",
    label: "Negras",
    note: "Efecto inmediato.",
    cards: [
      {
        id: "noche",
        name: "Noche",
        quote: '"Se apagan las luces"',
        effect: "Cae la noche: los Lykoi cazan y el Guardián vela.",
        salem: "Night",
      },
      {
        id: "conspiracion",
        name: "Conspiración",
        quote: '"Maullido en coro"',
        effect: "Todos pasan una carta de juicio al gato de su izquierda.",
        salem: "Conspiracy",
      },
      {
        id: "perro",
        name: "El Perro",
        quote: '"Un ladrido en la niebla"',
        effect: "Se posa sobre un gato al alba y queda como carta azul.",
        salem: "Black Cat",
      },
    ],
  },
  {
    color: "verdes",
    label: "Verdes",
    note: "Un solo uso.",
    cards: [
      {
        id: "chivo",
        name: "Chivo Expiatorio",
        quote: '"Que pague otro"',
        effect: "Mueve las acusaciones de un gato a otro.",
        salem: "Scapegoat",
      },
      {
        id: "zarpazo",
        name: "Zarpazo",
        quote: '"Robo en la despensa"',
        effect: "Obliga a un gato a pasar una carta a otro.",
        salem: "Robbery",
      },
      {
        id: "malojo",
        name: "Mal de Ojo",
        quote: '"Maldición felina"',
        effect: "Descarta las cartas azules de un gato.",
        salem: "Curse",
      },
    ],
  },
];
