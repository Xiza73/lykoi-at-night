import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("renders the hero title and a couple of the nine roles", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: /Lykoi/i, level: 1 }),
    ).toBeInTheDocument();
    // The role gallery renders each role name as a heading.
    expect(
      screen.getByRole("heading", { name: "Cazador de Sombras" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Vidente del Alféizar" }),
    ).toBeInTheDocument();
  });

  it("describes the destierro and parity win condition in the rules", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: "El destierro" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tantos como gatos honestos/i)).toBeInTheDocument();
  });
});
