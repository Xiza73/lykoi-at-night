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

/**
 * Fills a six-seat Alcalde lobby via Personalizado (Clásico + the Alcalde del
 * Callejón toggle) and deals. With the identity shuffle the roles fall in seat
 * order: Ana (p1) wolf, Beto (p2) seer, Caro (p3) guardian, Dario (p4) the
 * Alcalde, Eva/Fabi villagers.
 */
async function fillMayorLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  // Personalizado starts from the Clásico hand; add the Alcalde del Callejón.
  await user.click(screen.getByRole("button", { name: /^alcalde del callejón$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * Fills a six-seat Cazador + Caperuza lobby via Personalizado (Clásico + the
 * Cazador de Sombras and Caperuza del Callejón toggles) and deals. With the
 * identity shuffle the roles fall in seat order (push order:
 * wolf, seer, guardian, hunter, littleRed, then villagers): Ana (p1) wolf, Beto
 * (p2) seer, Caro (p3) guardian, Dario (p4) the Cazador, Eva (p5) the Caperuza,
 * Fabi (p6) villager.
 */
async function fillHunterLittleRedLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  await user.click(screen.getByRole("button", { name: /^cazador de sombras$/i }));
  await user.click(screen.getByRole("button", { name: /^caperuza del callejón$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/** Opens the current seat's gate ("Ya lo tengo") to reveal their action. */
async function openGate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /ya lo tengo/i }));
}

/**
 * Fills a six-seat Bruja lobby via Personalizado (Clásico + the La Bruja del
 * Callejón toggle) and deals. With the identity shuffle the roles fall in seat
 * order (push order: wolf, seer, guardian, witch, then villagers): Ana (p1) wolf,
 * Beto (p2) seer, Caro (p3) guardian, Dario (p4) the Bruja, Eva/Fabi villagers.
 */
async function fillWitchLobbyAndDeal(user: ReturnType<typeof userEvent.setup>) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  // Personalizado starts from the Clásico hand; add La Bruja del Callejón.
  await user.click(
    screen.getByRole("button", { name: /^la bruja del callejón$/i }),
  );
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * Fills a six-seat Cazador + Cupido lobby via Personalizado (Clásico + the
 * Cazador de Sombras and Cupido del Callejón toggles) and deals. With the
 * identity shuffle the roles fall in seat order (push order:
 * wolf, seer, guardian, hunter, cupid, then villagers): Ana (p1) wolf, Beto (p2)
 * seer, Caro (p3) guardian, Dario (p4) the Cazador, Eva (p5) the Cupido, Fabi
 * (p6) villager.
 */
async function fillHunterCupidLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  await user.click(screen.getByRole("button", { name: /^cazador de sombras$/i }));
  await user.click(screen.getByRole("button", { name: /^cupido del callejón$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * Fills a six-seat Cupido lobby via Personalizado (Clásico + the Cupido del
 * Callejón toggle) and deals. With the identity shuffle the roles fall in seat
 * order: Ana (p1) wolf, Beto (p2) seer, Caro (p3) guardian, Dario (p4) the
 * Cupido, Eva/Fabi villagers.
 */
async function fillCupidLobbyAndDeal(
  user: ReturnType<typeof userEvent.setup>,
) {
  await setCount(user, 6);
  await user.click(screen.getByRole("button", { name: /^personalizado$/i }));
  // Personalizado starts from the Clásico hand; add the Cupido del Callejón.
  await user.click(screen.getByRole("button", { name: /^cupido del callejón$/i }));
  await renameSeats(user, NAMES);
  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/**
 * Drives one day's SECRET vote pass from the discussion board. `ballots` maps a
 * living player's NAME to who they vote for — a name, or null to abstain — in
 * SEAT ORDER (the order the phone travels). Opens the vote, walks each living
 * seat's gate + ballot, and lands on the result screen (or the hunter step, if a
 * banished Cazador triggers revenge).
 */
async function driveDayVote(
  user: ReturnType<typeof userEvent.setup>,
  ballots: readonly (readonly [string, string | null])[],
) {
  await user.click(screen.getByRole("button", { name: /^a votar$/i }));
  for (const [, target] of ballots) {
    await openGate(user);
    if (target === null) {
      await user.click(screen.getByRole("button", { name: /me abstengo/i }));
    } else {
      await user.click(
        screen.getByRole("button", { name: new RegExp(`votar por ${target}`, "i") }),
      );
    }
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
  }
}

/**
 * Runs the first night at 6 (Clásico) with the lone wolf killing nobody: the
 * wolf abstains, the seer/guardian/villagers pass, so the whole table survives
 * into the first full day. Leaves the screen on the day's discussion board.
 */
async function walkToDayNoNightKill(user: ReturnType<typeof userEvent.setup>) {
  // Ana (wolf): abstain by voting no one is impossible; instead ward saves — but
  // the simplest survivable night is the guardian warding the wolf's target.
  // Here the wolf votes Fabi and the guardian wards Fabi, so nobody falls.
  await openGate(user); // Ana (wolf)
  await user.click(screen.getByRole("button", { name: /votar por fabi/i }));
  await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
  await openGate(user); // Beto (seer)
  await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
  await user.click(screen.getByRole("button", { name: /^listo$/i }));
  await openGate(user); // Caro (guardian): ward Fabi
  await user.click(screen.getByRole("button", { name: /curar a fabi/i }));
  await user.click(screen.getByRole("button", { name: /^listo$/i }));
  for (let i = 0; i < 3; i += 1) {
    await openGate(user); // Dario, Eva, Fabi (villagers)
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
  }
  await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
}

/**
 * Runs the first night of a Cazador lobby with NOBODY dying, so the Cazador
 * survives into the day. Seat order: Ana (wolf) votes Fabi, Beto (seer) reads
 * Eva, Caro (guardian) wards Fabi (saving the wolf's target), Dario (the
 * Cazador) pre-commits nobody, Eva/Fabi pass. Leaves the screen on the day's
 * discussion board.
 */
async function walkHunterNightNoKill(
  user: ReturnType<typeof userEvent.setup>,
) {
  await openGate(user); // Ana (wolf): votes Fabi
  await user.click(screen.getByRole("button", { name: /votar por fabi/i }));
  await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
  await openGate(user); // Beto (seer)
  await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
  await user.click(screen.getByRole("button", { name: /^listo$/i }));
  await openGate(user); // Caro (guardian): wards Fabi
  await user.click(screen.getByRole("button", { name: /curar a fabi/i }));
  await user.click(screen.getByRole("button", { name: /^listo$/i }));
  await openGate(user); // Dario (Cazador): pre-commits nobody
  await user.click(screen.getByRole("button", { name: /^a nadie$/i }));
  await user.click(screen.getByRole("button", { name: /^listo$/i }));
  for (let i = 0; i < 2; i += 1) {
    await openGate(user); // Eva, Fabi (villagers)
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
  }
  await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
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

    // Seat 3 — Caro (the Curandero): wards nobody.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos el curandero del callejón/i }),
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

    // Into the next day's discussion board.
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/dario \(caído\)/i)).toBeInTheDocument();
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
        screen.queryByRole("heading", { name: /sos el curandero/i }),
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

  it("banishes the lone werewolf on a day vote and the town wins", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // Night in seat order: Ana (wolf) votes Dario, Beto (seer) reads Eva,
    // Caro (guardian) passes, the three villagers pass — Dario falls.
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

    // Day discussion board — Dario is a dead tile, no longer a vote target.
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();

    // The town votes Ana (the lone wolf) into banishment; Ana abstains. Living
    // seats in order: Ana, Beto, Caro, Eva, Fabi.
    await driveDayVote(user, [
      ["Ana", null],
      ["Beto", "Ana"],
      ["Caro", "Ana"],
      ["Eva", "Ana"],
      ["Fabi", "Ana"],
    ]);

    // The recount names the banished, then the town's victory falls.
    expect(
      screen.getByRole("heading", { name: /el recuento/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/el callejón destierra a ana/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cae la noche/i }));
    expect(
      screen.getByText(/el vecindario duerme tranquilo/i),
    ).toBeInTheDocument();
  });

  it("banishes nobody when the day vote ties and there is no Alcalde", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);
    await walkToDayNoNightKill(user);

    // Six living seats, a clean 2–2 tie between Eva and Fabi (the rest abstain).
    // With no Alcalde, the alley cannot break it: nobody falls.
    await driveDayVote(user, [
      ["Ana", "Eva"],
      ["Beto", "Eva"],
      ["Caro", "Fabi"],
      ["Dario", "Fabi"],
      ["Eva", null],
      ["Fabi", null],
    ]);

    expect(
      screen.getByRole("heading", { name: /el recuento/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nadie cae hoy/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cae la noche/i }));
    // Falls into the next night.
    expect(
      screen.getByRole("heading", { name: /le toca a/i }),
    ).toBeInTheDocument();
  });

  it("lets the Alcalde break a tied day vote and banish their pick", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillMayorLobbyAndDeal(user);
    // Reveal order: Ana wolf, Beto seer, Caro guardian, Dario Alcalde, Eva/Fabi.
    await walkReveal(user);
    await walkToDayNoNightKill(user);

    // A clean 2–2 raw tie between Eva and Fabi. The Alcalde (Dario) votes Fabi,
    // so his doubled vote tips the balance to Fabi.
    await driveDayVote(user, [
      ["Ana", "Eva"],
      ["Beto", "Eva"],
      ["Caro", "Fabi"],
      ["Dario", "Fabi"],
      ["Eva", null],
      ["Fabi", null],
    ]);

    expect(
      screen.getByRole("heading", { name: /el recuento/i }),
    ).toBeInTheDocument();
    // Fabi is banished, and the tie-break line names the Alcalde (not by name).
    expect(screen.getByText(/el callejón destierra a fabi/i)).toBeInTheDocument();
    expect(
      screen.getByText(/el alcalde inclinó la balanza/i),
    ).toBeInTheDocument();
  });

  it("a DEAD Alcalde no longer breaks a tied day vote — the tie stands", async () => {
    // Regression guard for the dead-mayor invariant. The caller resolves the
    // tie-breaking ballot from `livingSeats.find(role === "mayor")`, so once the
    // Alcalde is dead NO living mayor is found and `resolveDayVotes` receives a
    // null mayorVote — the alley can no longer tip a raw tie.
    //
    // Setup: Alcalde lobby (Ana wolf, Beto seer, Caro guardian, Dario Alcalde,
    // Eva/Fabi villagers). Night 1 the wolf kills the Alcalde (Dario) and the
    // guardian wards nobody, so Dario falls. On the following day the five living
    // seats (Ana, Beto, Caro, Eva, Fabi) form a clean 2–2 tie between Eva and
    // Fabi. With the Alcalde dead the tie is NOT tipped: nobody is banished.
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillMayorLobbyAndDeal(user);
    await walkReveal(user);

    // Night in seat order: Ana (wolf) kills Dario (the Alcalde), Beto (seer)
    // reads Eva, Caro (guardian) wards nobody, Dario/Eva/Fabi pass.
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

    // Dawn: the Alcalde fell. Into the day's discussion board.
    expect(
      screen.getByText(/dario no volvió al callejón/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/dario \(caído\)/i)).toBeInTheDocument();

    // Five living seats (Dario is dead, no longer a ballot). A clean 2–2 tie
    // between Eva and Fabi; the rest abstain. If a dead Alcalde still tipped
    // ties, one of them would fall — but the recount must report a stalemate.
    await driveDayVote(user, [
      ["Ana", "Eva"],
      ["Beto", "Eva"],
      ["Caro", "Fabi"],
      ["Eva", "Fabi"],
      ["Fabi", null],
    ]);

    expect(
      screen.getByRole("heading", { name: /el recuento/i }),
    ).toBeInTheDocument();
    // Nobody falls, and crucially the Alcalde tie-break line is absent.
    expect(screen.getByText(/nadie cae hoy/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/el alcalde inclinó la balanza/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/el callejón destierra a/i),
    ).not.toBeInTheDocument();
  });

  it("the Cazador pre-commits at night; killing him takes both automatically, no interactive step", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillHunterLobbyAndDeal(user);
    await walkReveal(user);

    // Night in seat order: Ana (wolf) votes Dario (the Cazador), Beto (seer)
    // reads Eva, Caro (guardian) passes, then Dario (Cazador) PRE-COMMITS Beto —
    // a shot target sitting EARLIER (seat 2) than the Cazador himself (seat 4).
    // The dawn text must name the roles in the STORY (Dario fell and dragged Beto
    // down), NOT whoever sits earliest — so this guards against seat-order naming.
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /votar por dario/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Cazador): pre-commits Beto (seat 2) as his shot.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos el cazador de sombras/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /llevarse a beto/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seats 5-6 — Eva, Fabi (villagers): plain pass.
    for (let i = 0; i < 2; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // No interactive revenge step: dawn lists BOTH the Cazador and his shot in the
    // neutral form, naming DARIO (the fallen Cazador, the wolves' victim) first and
    // BETO (his shot, though seated earlier) as also fallen. Seat-order naming
    // would invert these — this assertion catches that inversion.
    expect(
      screen.queryByRole("heading", { name: /el cazador de sombras cae/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /amanece\. dario no volvió al callejón\. beto tampoco\./i,
      ),
    ).toBeInTheDocument();

    // Into the day's discussion board — both are fallen tiles.
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/dario \(caído\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/beto \(caído\)/i)).toBeInTheDocument();
  });

  it("a Cazador who pre-commits 'A nadie' falls alone at night", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillHunterLobbyAndDeal(user);
    await walkReveal(user);

    // Ana (wolf) kills Dario (Cazador), Beto reads Eva, Caro wards nobody, then
    // Dario pre-commits "A nadie", Eva/Fabi pass.
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /votar por dario/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Cazador): takes nobody.
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /^a nadie$/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    for (let i = 0; i < 2; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Only the Cazador fell; no second name in the dawn report.
    expect(
      screen.getByText(/^amanece\. dario no volvió al callejón\.$/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/y se llevó consigo/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(screen.getByLabelText(/dario \(caído\)/i)).toBeInTheDocument();
    // Eva survived — a living vote target on the board.
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
  });

  it("banishing the Cazador by day opens the interactive revenge — a pick takes the target", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillHunterLobbyAndDeal(user);
    await walkReveal(user);
    await walkHunterNightNoKill(user);

    // Day: the town banishes Dario (the Cazador). Living seats in order:
    // Ana, Beto, Caro, Dario, Eva, Fabi. Everyone but Dario votes him.
    await driveDayVote(user, [
      ["Ana", "Dario"],
      ["Beto", "Dario"],
      ["Caro", "Dario"],
      ["Dario", null],
      ["Eva", "Dario"],
      ["Fabi", "Dario"],
    ]);

    // The Cazador was banished: the interactive revenge opens.
    expect(
      screen.getByRole("heading", { name: /el cazador de sombras cae/i }),
    ).toBeInTheDocument();

    // He picks Ana (the wolf) and takes her down.
    await user.click(screen.getByRole("button", { name: /llevarse a ana/i }));
    await user.click(screen.getByRole("button", { name: /se lleva a ana/i }));

    // Ana (the last wolf) is gone: the town wins.
    expect(
      screen.getByText(/el vecindario duerme tranquilo/i),
    ).toBeInTheDocument();
  });

  it("banishing the Cazador by day allows taking NOBODY", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillHunterLobbyAndDeal(user);
    await walkReveal(user);
    await walkHunterNightNoKill(user);

    await driveDayVote(user, [
      ["Ana", "Dario"],
      ["Beto", "Dario"],
      ["Caro", "Dario"],
      ["Dario", null],
      ["Eva", "Dario"],
      ["Fabi", "Dario"],
    ]);

    expect(
      screen.getByRole("heading", { name: /el cazador de sombras cae/i }),
    ).toBeInTheDocument();

    // He takes nobody: no one else falls, the recount stands and night follows.
    await user.click(
      screen.getByRole("button", { name: /no llevarse a nadie/i }),
    );

    // Nobody else was taken: Ana and everyone but Dario are still living. The
    // clock advances into the next night.
    expect(
      screen.getByRole("heading", { name: /le toca a ana/i }),
    ).toBeInTheDocument();
  });

  it("shows the live balance readout on the table step and updates as the hand changes", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    // Drive the wizard to the table step at 6 players with Clásico.
    await setCount(user, 6);
    await user.click(screen.getByRole("button", { name: /^clásico$/i }));

    const balance = screen.getByLabelText(/equilibrio de la partida/i);
    // Clásico-6 (1 wolf, seer, guardian) scores +7 — very town-favoured.
    expect(balance).toHaveTextContent("+7");
    expect(balance).toHaveTextContent(/muy a favor del pueblo/i);

    // Drop the Curandero del Callejón: its seat becomes a villager, so the total
    // falls by the guardian's +3 minus the villager's +1 — a net −2, to +5.
    await user.click(
      screen.getByRole("button", { name: /^curandero del callejón$/i }),
    );
    expect(balance).toHaveTextContent("+5");
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

  it("the Curandero cannot watch over the same cat two nights running", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // Night 1 — Ana (wolf) targets Fabi, Beto (seer) reads Eva, Caro (the
    // Curandero) cures Fabi (saving the wolf's target), the villagers pass.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por fabi/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (Curandero): cures Fabi
    expect(
      screen.getByRole("heading", { name: /sos el curandero del callejón/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /curar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    for (let i = 0; i < 3; i += 1) {
      await openGate(user); // Dario, Eva, Fabi (villagers)
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // The ward held: nobody fell — Fabi survived the attack.
    expect(screen.getByText(/nadie cayó esta noche/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));

    // Day 1 — nobody is lynched, straight into night 2.
    await user.click(screen.getByRole("button", { name: /que nadie caiga hoy/i }));

    // Night 2 — walk to the Curandero's turn. Ana votes Eva, Beto reads Dario.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a dario/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 3 — Caro (the Curandero). Fabi was cured last night, so Fabi is NOT
    // offered tonight, while another living cat (Eva) still is.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos el curandero del callejón/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /curar a fabi/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /curar a eva/i }),
    ).toBeInTheDocument();
    // The exclusion note names last night's ward.
    expect(
      screen.getByText(/no podés cuidar a fabi otra vez/i),
    ).toBeInTheDocument();
  });

  it("the Cupido links two cats on night 1; a lovers-reveal pass tells each their partner; killing one chains the other", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillCupidLobbyAndDeal(user);
    await walkReveal(user);

    // Night 1, main pass. Ana (wolf) votes Eva (a lover-to-be), Beto (seer) reads
    // Fabi, Caro (guardian) wards nobody, Dario (Cupido) links Eva and Fabi,
    // Eva/Fabi pass.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards nobody
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Cupido): links Eva and Fabi. Confirm is disabled until
    // exactly two are chosen.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos cupido/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enamorar a estos dos/i }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /enamorar a eva/i }));
    await user.click(screen.getByRole("button", { name: /enamorar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /enamorar a estos dos/i }));

    // Seats 5-6 — Eva, Fabi (villagers): plain pass, completing the main pass.
    for (let i = 0; i < 2; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Now the lovers-reveal pass runs (night 1 only). Six living seats each take a
    // gate then a private card. Ana/Beto/Caro/Dario are NOT in love; Eva and Fabi
    // learn they are paired with each other.
    // Seat 1 — Ana: not in love.
    await openGate(user);
    expect(
      screen.getByText(/no estás enamorado esta noche/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    // Seats 2-4 — Beto, Caro, Dario: also not in love.
    for (let i = 0; i < 3; i += 1) {
      await openGate(user);
      expect(
        screen.getByText(/no estás enamorado esta noche/i),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }
    // Seat 5 — Eva: enamorada de Fabi.
    await openGate(user);
    expect(
      screen.getByText(/estás enamorado de fabi/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    // Seat 6 — Fabi: enamorada de Eva. This is the last seat: the night resolves.
    await openGate(user);
    expect(
      screen.getByText(/estás enamorado de eva/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Dawn: the pack killed Eva, and the lover bond dragged Fabi down with her —
    // listed in the neutral form (Eva first as the wolves' victim, then Fabi).
    expect(
      screen.getByText(
        /amanece\. eva no volvió al callejón\. fabi tampoco\./i,
      ),
    ).toBeInTheDocument();

    // Into the day's board — both lovers are fallen tiles.
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/eva \(caído\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fabi \(caído\)/i)).toBeInTheDocument();
  });

  it("the Cupido has no pairing action on night 2 — he just passes", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillCupidLobbyAndDeal(user);
    await walkReveal(user);

    // Night 1 main pass: wolf abstains-by-warding (kills nobody). Ana votes Fabi,
    // Beto reads Fabi, Caro (guardian) wards Fabi (so the wolf's target survives),
    // Dario (Cupido) links Ana and Beto (two cats who will both survive), Eva/Fabi
    // pass.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por fabi/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards Fabi
    await user.click(screen.getByRole("button", { name: /curar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Dario (Cupido): links Ana and Beto
    await user.click(screen.getByRole("button", { name: /enamorar a ana/i }));
    await user.click(screen.getByRole("button", { name: /enamorar a beto/i }));
    await user.click(screen.getByRole("button", { name: /enamorar a estos dos/i }));
    for (let i = 0; i < 2; i += 1) {
      await openGate(user); // Eva, Fabi pass
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Lovers-reveal pass (six seats): everyone taps through. Ana & Beto are paired.
    for (let i = 0; i < 6; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // The ward held: nobody fell. Into day 1, then skip straight to night 2.
    expect(screen.getByText(/nadie cayó esta noche/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    await user.click(screen.getByRole("button", { name: /que nadie caiga hoy/i }));

    // Night 2: walk to the Cupido's seat. Ana (wolf) votes Eva, Beto reads Eva,
    // Caro wards nobody.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards nobody
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Cupido) on NIGHT 2: no pairing screen, just the sleep
    // pass. The two-select confirm must be gone, and instead of the bare "Sos
    // Cupido" action heading he sees the villager-style sleep screen naming his
    // full role title ("Sos Cupido del Callejón").
    await openGate(user);
    expect(
      screen.queryByRole("button", { name: /enamorar a estos dos/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /sos cupido del callejón/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dormís tranquilo/i)).toBeInTheDocument();
  });

  it("a triple-death night (Cazador who is also a lover, with a shot) names ALL three fallen at dawn", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillHunterCupidLobbyAndDeal(user);
    await walkReveal(user);

    // Seats: Ana (wolf), Beto (seer), Caro (guardian), Dario (Cazador), Eva
    // (Cupido), Fabi (villager).
    // Main pass: Ana kills Dario (the Cazador), Beto reads Fabi, Caro wards
    // nobody, Dario pre-commits his shot on Fabi, Eva (Cupido) links Dario and
    // Beto, Fabi passes. Three cats will fall: Dario (the pack's victim), Fabi
    // (his shot) and Beto (Dario's lover, chained by the bond).
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por dario/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards nobody
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Dario (Cazador): pre-commits Fabi
    await user.click(screen.getByRole("button", { name: /llevarse a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Eva (Cupido): links Dario and Beto
    await user.click(screen.getByRole("button", { name: /enamorar a dario/i }));
    await user.click(screen.getByRole("button", { name: /enamorar a beto/i }));
    await user.click(screen.getByRole("button", { name: /enamorar a estos dos/i }));
    await openGate(user); // Fabi (villager): pass
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Lovers-reveal pass (six seats): everyone taps through.
    for (let i = 0; i < 6; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Dawn: Dario leads as the wolves' victim. Both his shot (Fabi) and his lover
    // (Beto) are listed as also fallen, in seat order, in the neutral form.
    expect(
      screen.getByText(
        /amanece\. dario no volvió al callejón\. beto y fabi tampoco\./i,
      ),
    ).toBeInTheDocument();

    // The day board shows all three as fallen tiles.
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/dario \(caído\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/beto \(caído\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fabi \(caído\)/i)).toBeInTheDocument();
  });

  it("the Caperuza survives the wolves while the Cazador lives — dawn reports no death, and she has no night action", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillHunterLittleRedLobbyAndDeal(user);
    await walkReveal(user);

    // Night 1: Ana (wolf) votes Eva (the Caperuza), Beto (seer) reads Fabi, Caro
    // (guardian) wards nobody, Dario (the Cazador) pre-commits nobody, Eva (the
    // Caperuza) sleeps with no action, Fabi passes. The wolves cannot take Eva
    // while Dario breathes, so nobody falls.
    await openGate(user); // Ana (wolf): votes Eva
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards nobody
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Dario (Cazador): pre-commits nobody
    await user.click(screen.getByRole("button", { name: /^a nadie$/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 5 — Eva (the Caperuza): NO action, the plain sleep screen naming her
    // full role title.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos caperuza del callejón/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dormís tranquilo/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 6 — Fabi (villager): plain pass.
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Dawn: the Caperuza was untouchable while the Cazador lived — no death.
    expect(screen.getByText(/amaneció sin bajas/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
  });

  it("the Bruja reserves her blind heal: the pack's victim is saved and the potion is spent", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillWitchLobbyAndDeal(user);
    await walkReveal(user);

    // Night 1: Ana (wolf) votes Eva, Beto (seer) reads Fabi, Caro (guardian) wards
    // nobody, Dario (the Bruja) reserves the blind life potion (no poison), Eva and
    // Fabi pass. The heal saves the pack's target — nobody falls.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards nobody
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Bruja): reserves the life potion, poisons no one.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos la bruja del callejón/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /reservar la poción de vida/i }),
    );
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seats 5-6 — Eva, Fabi (villagers): plain pass.
    for (let i = 0; i < 2; i += 1) {
      await openGate(user);
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Dawn: the blind heal saved the pack's victim — no death.
    expect(screen.getByText(/amaneció sin bajas/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));

    // Day 1 — skip the lynch straight into night 2.
    await user.click(screen.getByRole("button", { name: /que nadie caiga hoy/i }));

    // Night 2 — walk to the Bruja's seat. Ana votes Eva, Beto reads Fabi, Caro
    // wards nobody.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards nobody
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Bruja): the life potion is SPENT, so its reserve toggle
    // is gone; only the poison remains available.
    await openGate(user);
    expect(
      screen.queryByRole("button", { name: /reservar la poción de vida/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /envenenar a eva/i }),
    ).toBeInTheDocument();
  });

  it("the Bruja's poison kills through the Curandero's ward and dawn names the fallen", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillWitchLobbyAndDeal(user);
    await walkReveal(user);

    // Night 1: Ana (wolf) votes Eva, Beto (seer) reads Fabi, Caro (guardian) wards
    // EVA (which stops the wolves' attack on her), Dario (the Bruja) poisons Eva —
    // the poison ignores the ward, so Eva still dies. Eva/Fabi pass.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards Eva
    await user.click(screen.getByRole("button", { name: /curar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Bruja): no heal, poisons Eva.
    await openGate(user);
    await user.click(screen.getByRole("button", { name: /envenenar a eva/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    for (let i = 0; i < 2; i += 1) {
      await openGate(user); // Eva, Fabi (villagers)
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Dawn: despite the ward, the poison felled Eva — named in the neutral form.
    expect(
      screen.getByText(/^amanece\. eva no volvió al callejón\.$/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));
    expect(screen.getByLabelText(/eva \(caído\)/i)).toBeInTheDocument();
  });

  it("the Bruja has no night action once both potions are spent", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillWitchLobbyAndDeal(user);
    await walkReveal(user);

    // Night 1: Ana (wolf) votes Eva, Beto (seer) reads Ana, Caro (guardian) wards
    // nobody, Dario (the Bruja) reserves the heal (saving Eva) AND poisons Fabi.
    // Eva/Fabi pass. Both potions are spent this night.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a ana/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards nobody
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Bruja): reserve heal AND poison Fabi.
    await openGate(user);
    await user.click(
      screen.getByRole("button", { name: /reservar la poción de vida/i }),
    );
    await user.click(screen.getByRole("button", { name: /envenenar a fabi/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    for (let i = 0; i < 2; i += 1) {
      await openGate(user); // Eva, Fabi (villagers)
      await user.click(screen.getByRole("button", { name: /^listo$/i }));
    }

    // Dawn: Eva was healed; Fabi fell to the poison (the only death).
    expect(
      screen.getByText(/^amanece\. fabi no volvió al callejón\.$/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /volver al callejón/i }));

    // Day 1 — skip the lynch straight into night 2.
    await user.click(screen.getByRole("button", { name: /que nadie caiga hoy/i }));

    // Night 2 — walk to the Bruja's seat (Fabi is dead; living seats: Ana, Beto,
    // Caro, Dario, Eva). Ana votes Eva, Beto reads Ana, Caro wards nobody.
    await openGate(user); // Ana (wolf)
    await user.click(screen.getByRole("button", { name: /votar por eva/i }));
    await user.click(screen.getByRole("button", { name: /confirmar voto/i }));
    await openGate(user); // Beto (seer)
    await user.click(screen.getByRole("button", { name: /mirar a ana/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));
    await openGate(user); // Caro (guardian): wards nobody
    await user.click(screen.getByRole("button", { name: /nadie \/ pasar/i }));
    await user.click(screen.getByRole("button", { name: /^listo$/i }));

    // Seat 4 — Dario (the Bruja) with BOTH potions spent: the plain sleep screen,
    // no reserve toggle and no poison targets.
    await openGate(user);
    expect(
      screen.getByRole("heading", { name: /sos la bruja del callejón/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dormís tranquilo/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reservar la poción de vida/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /envenenar a/i }),
    ).not.toBeInTheDocument();
  });
});
