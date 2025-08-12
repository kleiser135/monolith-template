import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AuthLayout } from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders title, subtitle and children", () => {
    render(
      <AuthLayout title="Sign In" subtitle="Welcome back">
        <div data-testid="child">Child Content</div>
      </AuthLayout>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders brand link to home with label", () => {
    render(
      <AuthLayout title="Auth">
        <div />
      </AuthLayout>
    );

    const link = screen.getByRole("link", { name: /app template/i });
    expect(link).toBeInTheDocument();
    // Next.js Link renders an anchor under the hood; ensure href attribute exists
    expect(link).toHaveAttribute("href", "/");

    // Shows short brand text block as part of the logo
    expect(screen.getByText("AT")).toBeInTheDocument();
  });

  it("omits subtitle when not provided", () => {
    render(
      <AuthLayout title="Only Title">
        <div />
      </AuthLayout>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Only Title" })).toBeInTheDocument();
    // Ensure a typical subtitle string is not present
    expect(screen.queryByText(/subtitle/i)).not.toBeInTheDocument();
  });
});



