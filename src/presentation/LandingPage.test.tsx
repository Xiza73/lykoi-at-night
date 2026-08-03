import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("renders the hero title, an identity and an action card", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: /Lykoi/i, level: 1 }),
    ).toBeInTheDocument();
    // The identity gallery renders each role name as a heading; scope to it so
    // the query stays unique even though the lobby also names the Guardián.
    expect(
      screen.getByRole("heading", { name: "Guardián del Umbral" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coartada")).toBeInTheDocument();
  });
});
