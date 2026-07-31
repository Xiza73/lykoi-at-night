/**
 * The 4 "Cartas de mano" shown as a row in the #cartas section. Copy is taken
 * verbatim from the design file. `tone` selects the accent for the kind label
 * and (for the blood-toned "Presagio") a warmer card treatment.
 */

export type HandCardTone = "gold" | "blood";

export interface HandCard {
  id: string;
  kind: string;
  name: string;
  description: string;
  tone: HandCardTone;
}

export const handCards: HandCard[] = [
  {
    id: "acusacion",
    kind: "Acusación",
    name: '"Fue él, lo vi"',
    description:
      "Pon una marca de sospecha sobre otro gato. Con tres marcas, empieza el juicio.",
    tone: "gold",
  },
  {
    id: "coartada",
    kind: "Coartada",
    name: '"Estaba en la caja"',
    description:
      "Retira una marca de sospecha tuya o de otro. Nadie pregunta de qué caja.",
    tone: "gold",
  },
  {
    id: "conspiracion",
    kind: "Conspiración",
    name: "Maullido en coro",
    description:
      "Cancela el juicio en curso. La mesa entera cambia de tema, incómoda.",
    tone: "blood",
  },
  {
    id: "perro",
    kind: "Presagio",
    name: "El Perro",
    description:
      "Quien la robe la conserva boca arriba. Al final de la noche, ladra. Suerte con eso.",
    tone: "blood",
  },
];
