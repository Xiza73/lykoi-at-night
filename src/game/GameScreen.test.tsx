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
 * Sombras toggle) and deals. With the identity shuffle the roles
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

/** Opens the current seat's gate ("Ya lo tengo") to reveal their action. */
async function openGate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
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

    // The night opens on the FIRST seat's gate — named by the player, not a role.
    expect(
      screen.getByRole("heading", { name: /le toca a ana/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pásale el teléfono a ana/i),
    ).toBeInTheDocument();
  });

  it("runs a full night in seat order: wolf votes, seer reads, others pass, dawn reports the fall", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // Seat 1 — Ana (the lone Lykoi): votes Dario, a villager.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos un lykoi/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /votar por dario/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));

    // Seat 2 — Beto (the Vidente): reads Eva.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos la vidente/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 3 — Caro (the Guardián): wards nobody.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos el guardián del umbral/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seats 4-6 — Dario, Eva, Fabi (villagers): no night action.
    for (let i = 0; i < 3; i += 1) {
      await openGate(user);
      expect(
        screen.getByText(/dormís tranquilo/i),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

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

  it("a Básico game shows no Vidente/Guardián screens — villagers just pass", async () => {
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

    // Seat 1 — Ana (wolf): votes Caro, a villager.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos un lykoi/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /votar por caro/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));

    // Seat 2 — Beto (wolf): also votes Caro. The tally shows Ana's prior vote.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos un lykoi/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ana votó por caro/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /votar por caro/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));

    // Seats 3-5 — Caro, Dario, Eva (villagers): NO seer/guardian screens at all.
    for (let i = 0; i < 3; i += 1) {
      await openGate(user);
      expect(screen.getByText(/dormís tranquilo/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /sos la vidente/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /sos el guardián/i }),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Both wolves voted Caro: Caro fell at dawn.
    expect(
      screen.getByText(/caro no volvió al callejón/i),
    ).toBeInTheDocument();
  });

  it("a tie makes the pack re-vote; a second tie spares the night", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillTwoWolfLobbyAndDeal(user);

    const packNames = ["Ana", "Beto", "Caro", "Dario", "Eva"] as const;
    for (let i = 0; i < packNames.length; i += 1) {
      await user.click(
        screen.getByRole("button", { name: /voltear la carta/i }),
      );
      const passLabel =
        i === packNames.length - 1 ? /ocultar y empezar/i : /ocultar y pasar/i;
      await user.click(screen.getByRole("button", { name: passLabel }));
    }

    // Round 1 — the two wolves vote DIFFERENT villagers (a tie).
    await openGate(user); // Ana
    await user.click(screen.getByRole("button", { name: /votar por caro/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto
    await user.click(screen.getByRole("button", { name: /votar por dario/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    // Villagers pass to finish round 1.
    for (let i = 0; i < 3; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Round 2 announced — the pack re-votes, again DIFFERENT villagers (a tie).
    await openGate(user); // Ana re-votes fresh
    expect(
      screen.getByRole("heading", { name: /sos un lykoi/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /votar por caro/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto re-votes fresh
    await user.click(screen.getByRole("button", { name: /votar por dario/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    // On the re-vote a non-wolf is told they do not vote — just pass.
    for (let i = 0; i < 3; i += 1) {
      await openGate(user);
      expect(
        screen.getByRole("heading", { name: /la manada volvió a dudar/i }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /siguiente/i }));
    }

    // Double tie: nobody fell this night.
    expect(screen.getByText(/amaneció sin bajas/i)).toBeInTheDocument();
    expect(
      screen.getByText(/la manada no se puso de acuerdo/i),
    ).toBeInTheDocument();
  });

  it("lynching the lone werewolf on the day ends the game with the town winning", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // Night in seat order: Ana (wolf) votes Dario, Beto (seer) reads Eva,
    // Caro (guardian) passes, the three villagers pass.
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /votar por dario/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    for (let i = 0; i < 3; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }
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

    // Night in seat order: Ana (wolf) votes Dario (the Cazador), Beto (seer)
    // reads Eva, Caro (guardian) passes, Dario/Eva/Fabi pass.
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /votar por dario/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    for (let i = 0; i < 3; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

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

    // Seat 1 — Ana (wolf): only living townsfolk are votable, never a fellow wolf.
    await openGate(user);
    expect(
      screen.getByRole("button", { name: /votar por caro/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /votar por ana/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /votar por beto/i }),
    ).not.toBeInTheDocument();
  });
});
