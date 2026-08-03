import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameScreen } from "./GameScreen";
import type { Shuffle } from "../domain/game/shuffle";

/**
 * Identity shuffle: leaves seat order untouched. With 6 players and config
 * {werewolves: 1, seer: true, guardian: true} the roles are dealt in order —
 * so Ana (p1) is the werewolf, Beto (p2) the seer, Caro (p3) the guardian, and
 * Dario/Eva/Fabi are villagers. Fully deterministic.
 */
const identityShuffle: Shuffle = (items) => [...items];

const NAMES = ["Ana", "Beto", "Caro", "Dario", "Eva", "Fabi"] as const;

/**
 * Walks the wizard's count sub-step: nudges the stepper to `target` (from the
 * default of six) and advances to the preset picker.
 */
async function setCount(
  user: ReturnType<typeof userEvent.setup>,
  target: number,
) {
  const delta = target - 6;
  const label = delta >= 0 ? /más gatos/i : /menos gatos/i;
  for (let i = 0; i < Math.abs(delta); i += 1) {
    await user.click(screen.getByRole("button", { name: label }));
  }
  await user.click(screen.getByRole("button", { name: /siguiente/i }));
}

/** Renames the prefilled roster inputs to the given names. */
async function renameSeats(
  user: ReturnType<typeof userEvent.setup>,
  seatNames: readonly string[],
) {
  for (let i = 0; i < seatNames.length; i += 1) {
    const input = screen.getByLabelText(`Nombre del gato ${i + 1}`);
    await user.clear(input);
    await user.type(input, seatNames[i]);
  }
}

/**
 * Drives the wizard to a dealt six-player Clásico game: count 6 -> Clásico
 * preset (1 Lykoi, Vidente, Guardián) -> rename seats -> deal. With the identity
 * shuffle the roles fall in seat order: Ana (p1) wolf, Beto (p2) seer, Caro (p3)
 * guardian, Dario/Eva/Fabi villagers.
 */
async function fillLobbyAndDeal(user: ReturnType<typeof userEvent.setup>) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^clásico$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/** Clicks through the whole secret reveal to reach the first night. */
async function walkReveal(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < NAMES.length; i += 1) {
    // Flip the current player's card, then pass the phone on.
    await user.click(screen.getByRole("button", { name: /voltear la carta/i }));
    const passLabel =
      i === NAMES.length - 1 ? /ocultar y empezar/i : /ocultar y pasar/i;
    await user.click(screen.getByRole("button", { name: passLabel }));
  }
}

/**
 * Fills a 5-seat lobby with a two-wolf, no-special config and deals. With the
 * identity shuffle the roles fall in seat order, so p1/p2 (Ana, Beto) are the
 * werewolves and p3/p4/p5 (Caro, Dario, Eva) are townsfolk. Uses the Básico
 * preset (no Vidente / Guardián) at count 5, then bumps to two Lykoi.
 */
async function fillTwoWolfLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, 5);
  await user.click(screen.getByRole("button", { name: /^básico$/i }));

  const packNames = ["Ana", "Beto", "Caro", "Dario", "Eva"] as const;
  await renameSeats(user, packNames);

  // Básico starts at one Lykoi; bump to two.
  await user.click(screen.getByRole("button", { name: /más lykoi/i }));

  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * Fills a six-seat Cazador lobby via Personalizado (Clásico + the Cazador de
 * Sombras toggle, no Madre Camada) and deals. With the identity shuffle the roles
 * fall in seat order: Ana (p1) wolf, Beto (p2) seer, Caro (p3) guardian, Dario
 * (p4) the Cazador, Eva/Fabi villagers.
 */
async function fillHunterLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  // Personalizado starts from the Clásico hand; add the Cazador de Sombras.
  await user.click(screen.getByRole("button", { name: /^cazador de sombras$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * The eight-seat roster used by the Madre Camada scenario. Enough town to absorb
 * a night kill AND a conversion without the wolves reaching parity, so the game
 * keeps going into the next day.
 */
const INFECTOR_NAMES = [
  "Ana",
  "Beto",
  "Caro",
  "Dario",
  "Eva",
  "Fabi",
  "Gala",
  "Hugo",
] as const;

/**
 * Fills an eight-seat lobby via Personalizado with the Madre Camada toggled on
 * (Clásico base + infector, no Cazador) and deals. With the identity shuffle the
 * roles fall in seat order: Ana (p1) wolf, Beto (p2) the Madre Camada, Caro (p3)
 * seer, Dario (p4) guardian, Eva/Fabi/Gala/Hugo villagers.
 */
async function fillInfectorLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, INFECTOR_NAMES.length);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  // Personalizado at eight players seeds two Lykoi; trim to one so the pack is
  // one werewolf plus the Madre Camada — leaving enough town to survive a kill
  // and a conversion in the same night.
  await user.click(screen.getByRole("button", { name: /menos lykoi/i }));
  // Add the Madre Camada.
  await user.click(screen.getByRole("button", { name: /^madre camada$/i }));
  await renameSeats(user, INFECTOR_NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * Fills a six-seat lobby via Personalizado (Clásico + El Insomne) and deals. With
 * the identity shuffle the roles fall in seat order: Ana (p1) wolf, Beto (p2) seer,
 * Caro (p3) guardian, Dario (p4) El Insomne, Eva/Fabi villagers.
 */
async function fillInsomniacLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  // Personalizado starts from the Clásico hand; add El Insomne.
  await user.click(screen.getByRole("button", { name: /^el insomne$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * Fills a six-seat lobby via Personalizado (Clásico + La Chismosa) and deals.
 * With the identity shuffle the roles fall in seat order: Ana (p1) wolf, Beto
 * (p2) seer, Caro (p3) guardian, Dario (p4) La Chismosa, Eva/Fabi villagers.
 */
async function fillGossipLobbyAndDeal(user: ReturnType<typeof userEvent.setup>) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  // Personalizado starts from the Clásico hand; add La Chismosa.
  await user.click(screen.getByRole("button", { name: /^la chismosa$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * Fills a six-seat lobby via Personalizado with BOTH the Cazador de Sombras and
 * the Madre Camada, and deals. With the identity shuffle: Ana (p1) wolf, Beto
 * (p2) the Madre Camada, Caro (p3) seer, Dario (p4) guardian, Eva (p5) the
 * Cazador, Fabi (p6) a villager. Used to check the same-night ordering when the
 * Cazador dies AND an infection lands.
 */
async function fillHunterAndInfectorLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  // Clásico base + the Madre Camada + the Cazador de Sombras.
  await user.click(screen.getByRole("button", { name: /^madre camada$/i }));
  await user.click(screen.getByRole("button", { name: /^cazador de sombras$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

describe("GameScreen", () => {
  it("deals the roster and shows the reveal step", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);

    expect(
      screen.getByRole("button", { name: /voltear la carta de ana/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/pásale el teléfono a/i)).toBeInTheDocument();
  });

  it("walks the reveal through to the first night", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // The night opens on the Guardian's gate.
    expect(
      screen.getByRole("heading", { name: /el guardián del umbral/i }),
    ).toBeInTheDocument();
  });

  it("runs a full night: guardian passes, wolves take a villager, dawn reports the fall", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // Guardian gate -> pick: ward nobody.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Wolves gate -> pick Dario (a villager) and seal.
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    await user.click(screen.getByRole("button", { name: /elegir a dario/i }));
    await user.click(screen.getByRole("button", { name: /sellar la presa/i }));

    // Seer gate -> look at Eva, then resolve the night.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Dawn: Dario did not survive the night.
    expect(
      screen.getByText(/dario no volvió al callejón/i),
    ).toBeInTheDocument();

    // Into the next day's board.
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /señalar a dario \(caído\)/i }),
    ).toBeInTheDocument();
  });

  it("lynching the lone werewolf on the day ends the game with the town winning", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // Night: guardian passes, wolves take Dario, seer looks at Eva, resolve.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    await user.click(screen.getByRole("button", { name: /elegir a dario/i }));
    await user.click(screen.getByRole("button", { name: /sellar la presa/i }));
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));

    // Day: select Ana (the werewolf) and banish her. With one wolf, that ends it.
    await user.click(screen.getByRole("button", { name: /señalar a ana/i }));
    await user.click(screen.getByRole("button", { name: /desterrar a ana/i }));

    expect(
      screen.getByText(/el vecindario duerme tranquilo/i),
    ).toBeInTheDocument();
  });

  it("night-killing the Cazador opens the revenge step, then a pick advances to dawn", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillHunterLobbyAndDeal(user);
    await walkReveal(user);

    // Night: guardian passes, wolves take Dario (the Cazador), seer looks at Eva.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    await user.click(screen.getByRole("button", { name: /elegir a dario/i }));
    await user.click(screen.getByRole("button", { name: /sellar la presa/i }));
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // The Cazador fell: the revenge step opens BEFORE dawn.
    expect(
      screen.getByRole("heading", { name: /el cazador de sombras cae/i }),
    ).toBeInTheDocument();

    // Pick Eva as the one taken down, then confirm the revenge.
    await user.click(screen.getByRole("button", { name: /llevarse a eva/i }));
    await user.click(screen.getByRole("button", { name: /se lleva a eva/i }));

    // Revenge resolved: the domain advanced to the day board.
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    // Eva was taken down by the Cazador.
    expect(
      screen.getByRole("button", { name: /señalar a eva \(caído\)/i }),
    ).toBeInTheDocument();
  });

  it("when the Cazador falls and an infection lands the same night, the turn notice comes first, then the revenge (neither is swallowed)", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillHunterAndInfectorLobbyAndDeal(user);
    await walkReveal(user);

    // Guardian passes.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Wolves take Eva (the Cazador) — she falls at night.
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    await user.click(screen.getByRole("button", { name: /elegir a eva/i }));
    await user.click(screen.getByRole("button", { name: /sellar la presa/i }));

    // The Madre Camada converts Fabi (a villager, not the wolves' target).
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /convertir a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seer looks at Dario, then resolve the night.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /mirar a dario/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // FIRST: Fabi's private "you were turned" gate — NOT swallowed by the revenge.
    expect(screen.getByText(/pásale el teléfono a fabi/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    expect(
      screen.getByText(/anoche te mordieron\. ahora cazás con los lykoi/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /entendido/i }));

    // THEN: the fallen Cazador's revenge step opens (it was not lost).
    expect(
      screen.getByRole("heading", { name: /el cazador de sombras cae/i }),
    ).toBeInTheDocument();
  });

  it("shows a werewolf their packmate on the reveal card", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillTwoWolfLobbyAndDeal(user);

    // First reveal: Ana (p1) is a werewolf; her flipped card names Beto (p2).
    await user.click(
      screen.getByRole("button", { name: /voltear la carta de ana/i }),
    );
    expect(screen.getByText(/cazan contigo: beto/i)).toBeInTheDocument();
  });

  it("the Madre Camada turns a townsperson, who gets a private dawn 'you were turned' gate", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillInfectorLobbyAndDeal(user);
    // Walk the eight-player reveal through to the first night.
    for (let i = 0; i < INFECTOR_NAMES.length; i += 1) {
      await user.click(screen.getByRole("button", { name: /voltear la carta/i }));
      const passLabel =
        i === INFECTOR_NAMES.length - 1 ? /ocultar y empezar/i : /ocultar y pasar/i;
      await user.click(screen.getByRole("button", { name: passLabel }));
    }

    // Guardian gate -> pick: ward nobody.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Wolves gate -> take Eva (a villager) and seal.
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    await user.click(screen.getByRole("button", { name: /elegir a eva/i }));
    await user.click(screen.getByRole("button", { name: /sellar la presa/i }));

    // Madre Camada gate -> convert Fabi (a villager) into the pack.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /convertir a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seer gate -> look at Caro, then resolve the night.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /mirar a caro/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Before dawn: the private "you were turned" gate hands the phone to Fabi.
    expect(screen.getByText(/pásale el teléfono a fabi/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    // Now Fabi is told, privately, that they hunt with the Lykoi.
    expect(
      screen.getByText(/anoche te mordieron\. ahora cazás con los lykoi/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /entendido/i }));

    // Then dawn breaks and reports Eva's death.
    expect(screen.getByText(/eva no volvió al callejón/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));

    // Into the day board: Fabi is now on the wolf side, so the town no longer
    // has the numbers to end it — the game is still in progress.
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    // Fabi is alive (turned, not killed) and selectable as a suspect.
    expect(
      screen.getByRole("button", { name: /señalar a fabi/i }),
    ).toBeInTheDocument();
  });

  it("gates El Insomne's private dawn footsteps reading, showing the living-wolf count", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillInsomniacLobbyAndDeal(user);
    await walkReveal(user);

    // Night: guardian passes, wolves take Fabi (a villager), seer looks at Eva.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    await user.click(screen.getByRole("button", { name: /elegir a fabi/i }));
    await user.click(screen.getByRole("button", { name: /sellar la presa/i }));
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Before dawn: the private gate hands the phone to El Insomne.
    expect(
      screen.getByText(/pásale el teléfono a el insomne/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));

    // The reading: one Lykoi still prowls (the lone werewolf, Ana).
    expect(
      screen.getByText(/anoche oíste un paso en el tejado/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/esos son los lykoi que aún rondan/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /entendido/i }));

    // Then dawn breaks and reports Fabi's death, into the day board.
    expect(screen.getByText(/fabi no volvió al callejón/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
  });

  it("La Chismosa peeks a fallen cat's role, after the first-night 'no chisme' case", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillGossipLobbyAndDeal(user);
    await walkReveal(user);

    // Night 1: guardian passes, wolves take Eva (a villager), seer looks at Fabi.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    await user.click(screen.getByRole("button", { name: /elegir a eva/i }));
    await user.click(screen.getByRole("button", { name: /sellar la presa/i }));
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /mirar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // La Chismosa's gate, then her turn: nobody has fallen yet on night one.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    expect(
      screen.getByText(/todavía no ha caído nadie\. no hay chisme esta noche/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Dawn reports Eva's fall; skip the day's vote into night two.
    expect(screen.getByText(/eva no volvió al callejón/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    await user.click(screen.getByRole("button", { name: /que nadie caiga hoy/i }));

    // Night 2: guardian passes, wolves take Fabi, seer looks at Caro.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    await user.click(screen.getByRole("button", { name: /elegir a fabi/i }));
    await user.click(screen.getByRole("button", { name: /sellar la presa/i }));
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /mirar a caro/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // La Chismosa's turn: Eva has fallen. Peek her — she was a Gato Doméstico.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /espiar a eva/i }));
    expect(
      screen.getByText(/eva era gato doméstico/i),
    ).toBeInTheDocument();
  });

  it("never offers a fellow wolf as a target in the wolves' night step", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillTwoWolfLobbyAndDeal(user);

    // Walk the reveal (five players) through to the first night.
    const packNames = ["Ana", "Beto", "Caro", "Dario", "Eva"] as const;
    for (let i = 0; i < packNames.length; i += 1) {
      await user.click(
        screen.getByRole("button", { name: /voltear la carta/i }),
      );
      const passLabel =
        i === packNames.length - 1 ? /ocultar y empezar/i : /ocultar y pasar/i;
      await user.click(screen.getByRole("button", { name: passLabel }));
    }

    // Guardian gate is still shown (turns never leak who is alive): pass through.
    await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Wolves' step: only living townsfolk are selectable, never a fellow wolf.
    await user.click(screen.getByRole("button", { name: /somos los lykoi/i }));
    expect(
      screen.getByRole("button", { name: /elegir a caro/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /elegir a ana/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /elegir a beto/i }),
    ).not.toBeInTheDocument();
  });
});
