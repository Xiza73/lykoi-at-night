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
