/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  beforeEach(() => {
    render(<Footer />);
  });

  it("should render the creator's name", () => {
    const creatorLink = screen.getByRole("link", { name: /kleiser135/i });
    expect(creatorLink).toBeInTheDocument();
    expect(creatorLink).toHaveAttribute("href", "https://github.com/kleiser135");
  });

  it("should render the link to the source code", () => {
    const sourceLink = screen.getByRole("link", { name: /github/i });
    expect(sourceLink).toBeInTheDocument();
    expect(sourceLink).toHaveAttribute(
      "href",
      "https://github.com/kleiser135/monolith-template"
    );
  });

  it("should contain the 'Built by' text", () => {
    // Use a regex that allows for flexible whitespace and intervening elements
    expect(screen.getByText(/built by/i)).toBeInTheDocument();
  });
}); 