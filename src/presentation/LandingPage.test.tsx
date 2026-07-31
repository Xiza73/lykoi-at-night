import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("renders the hero title and at least one role", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: /Lykoi/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Vidente del Alféizar")).toBeInTheDocument();
  });
});
