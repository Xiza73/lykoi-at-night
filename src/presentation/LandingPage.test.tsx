import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("renders the hero title, an identity and an action card", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: /Lykoi/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Guardián del Umbral")).toBeInTheDocument();
    expect(screen.getByText("Coartada")).toBeInTheDocument();
  });
});
