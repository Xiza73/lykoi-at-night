import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameScreen } from "./GameScreen";
import { ACCUSATIONS_FOR_TRIAL } from "../domain/game/game";
import type { Shuffle } from "../domain/game/shuffle";

/**
 * Identity shuffle: leaves order untouched. With 5 players and witchCount 2 the
 * first two seats (p1, p2) become witches, and each witch's "witch" tryal card
 * stays at index 0 — making outcomes fully deterministic.
 */
const identityShuffle: Shuffle = (items) => [...items];

const NAMES = ["Ana", "Beto", "Caro", "Dario", "Eva"] as const;

/** Fills the lobby with the five names and deals, reaching the reveal step. */
async function fillLobbyAndDeal(user: ReturnType<typeof userEvent.setup>) {
  // The lobby starts with 4 seats; add one to reach five.
  await user.click(screen.getByRole("button", { name: /añadir gato/i }));

  for (let i = 0; i < NAMES.length; i += 1) {
    const input = screen.getByLabelText(`Nombre del gato ${i + 1}`);
    await user.clear(input);
    await user.type(input, NAMES[i]);
  }

  await user.click(screen.getByRole("button", { name: /repartir los roles/i }));
}

/** Clicks through the whole secret reveal to reach the play board. */
async function walkReveal(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < NAMES.length; i += 1) {
    // Flip the current player's card, then pass the phone on.
    await user.click(screen.getByRole("button", { name: /voltear la carta/i }));
    const passLabel = i === NAMES.length - 1 ? /ocultar y empezar/i : /ocultar y pasar/i;
    await user.click(screen.getByRole("button", { name: passLabel }));
  }
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

  it("walks the reveal through to the play board", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    expect(
      screen.getByRole("heading", { name: /el callejón murmura/i }),
    ).toBeInTheDocument();
    // Every seat appears as an accusable tile.
    expect(
      screen.getByRole("button", { name: /señalar a ana/i }),
    ).toBeInTheDocument();
  });

  it("sends a player to trial after seven accusations", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // Caro is a villager (index 2) — accuse her the full threshold.
    for (let i = 0; i < ACCUSATIONS_FOR_TRIAL; i += 1) {
      await user.click(screen.getByRole("button", { name: /señalar a caro/i }));
    }

    expect(
      screen.getByRole("heading", { name: /el juicio de caro/i }),
    ).toBeInTheDocument();
  });

  it("eliminates the accused when their witch card is revealed", async () => {
    const user = userEvent.setup();
    render(<GameScreen shuffle={identityShuffle} />);

    await fillLobbyAndDeal(user);
    await walkReveal(user);

    // Ana is a witch (index 0); her witch card sits at tryal index 0.
    for (let i = 0; i < ACCUSATIONS_FOR_TRIAL; i += 1) {
      await user.click(screen.getByRole("button", { name: /señalar a ana/i }));
    }

    expect(
      screen.getByRole("heading", { name: /el juicio de ana/i }),
    ).toBeInTheDocument();

    // Reveal the first card — it is the witch card, so Ana falls.
    await user.click(screen.getByRole("button", { name: /revelar carta 1/i }));

    expect(screen.getByText(/ana cae\. la marca estaba ahí/i)).toBeInTheDocument();
    // The play board is gone: the accusation buttons no longer render.
    expect(
      screen.queryByRole("button", { name: /señalar a caro/i }),
    ).not.toBeInTheDocument();
  });
});
