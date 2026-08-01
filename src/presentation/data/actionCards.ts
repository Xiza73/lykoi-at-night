/**
 * The action-card deck, retold cat-flavored for "Lykoi at Night".
 *
 * The deck is grouped by four card colors. Every card keeps its real effect
 * (verified from the source rules).
 */

export type ActionColor = "rojas" | "azules" | "negras" | "verdes";

export interface ActionCard {
  id: string;
  /** Cat-flavored card name. */
  name: string;
  /** Short in-world quote. */
  quote: string;
  /** The card's effect on the game. */
  effect: string;
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
      },
      {
        id: "testigo",
        name: "Testigo",
        quote: '"Yo lo vi todo"',
        effect: "Otra marca de sospecha.",
      },
      {
        id: "evidencia",
        name: "Evidencia",
        quote: '"Pelos en la escena"',
        effect: "Otra marca de sospecha.",
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
      },
      {
        id: "refugio",
        name: "Refugio",
        quote: '"El regazo tibio"',
        effect: "Protege a un gato de morir esa noche.",
      },
      {
        id: "lazos",
        name: "Lazos de Camada",
        quote: '"Atados por la cola"',
        effect: "Liga a dos gatos: si uno cae, cae el otro.",
      },
      {
        id: "piedad",
        name: "Piedad",
        quote: '"Nadie toca al santo"',
        effect: "Bloquea efectos sobre un gato; no puedes jugarla sobre ti.",
      },
      {
        id: "cepo",
        name: "Cepo",
        quote: '"Atrapado en la gatera"',
        effect: "El gato pierde su turno.",
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
      },
      {
        id: "conspiracion",
        name: "Conspiración",
        quote: '"Maullido en coro"',
        effect: "Todos pasan una carta de sombra al gato de su izquierda.",
      },
      {
        id: "perro",
        name: "El Perro",
        quote: '"Un ladrido en la niebla"',
        effect: "Se posa sobre un gato al alba y queda como carta azul.",
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
      },
      {
        id: "zarpazo",
        name: "Zarpazo",
        quote: '"Robo en la despensa"',
        effect: "Obliga a un gato a pasar una carta a otro.",
      },
      {
        id: "malojo",
        name: "Mal de Ojo",
        quote: '"Maldición felina"',
        effect: "Descarta las cartas azules de un gato.",
      },
    ],
  },
];
