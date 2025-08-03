/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import { vi, describe, beforeEach, it, expect } from "vitest";
import { TemplateLanding } from "./TemplateLanding";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("TemplateLanding", () => {
  beforeEach(() => {
    render(<TemplateLanding />);
  });

  it("renders the main hero heading", () => {
    expect(screen.getByText("Build Your Next App")).toBeInTheDocument();
  });

  it("renders the hero description", () => {
    expect(
      screen.getByText(/A modern, production-ready Next.js template/i)
    ).toBeInTheDocument();
  });

  it("renders Get Started and Sign In buttons", () => {
    const getStartedLinks = screen.getAllByRole("link", { name: /get started/i });
    const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
    
    expect(getStartedLinks.length).toBeGreaterThan(0);
    expect(signInLinks.length).toBeGreaterThan(0);
  });

  it("renders the features section with three main features", () => {
    expect(screen.getByText("Everything You Need")).toBeInTheDocument();
    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("Testing")).toBeInTheDocument();
    expect(screen.getByText("Beautiful UI")).toBeInTheDocument();
  });

  it("displays authentication feature details", () => {
    expect(screen.getByText(/Complete authentication system/i)).toBeInTheDocument();
    expect(screen.getByText("JWT-based authentication")).toBeInTheDocument();
    expect(screen.getByText("Password reset flow")).toBeInTheDocument();
    expect(screen.getByText("Email verification")).toBeInTheDocument();
  });

  it("displays testing feature details", () => {
    expect(screen.getByText(/Comprehensive testing setup/i)).toBeInTheDocument();
    expect(screen.getByText("Comprehensive unit tests")).toBeInTheDocument();
    expect(screen.getByText("E2E test coverage")).toBeInTheDocument();
    expect(screen.getByText("TDD workflow")).toBeInTheDocument();
  });

  it("displays UI feature details", () => {
    expect(screen.getByText(/Modern, accessible UI components/i)).toBeInTheDocument();
    expect(screen.getByText("Radix UI components")).toBeInTheDocument();
    expect(screen.getByText("Dark/light mode")).toBeInTheDocument();
    expect(screen.getByText("Framer Motion")).toBeInTheDocument();
  });

  it("renders the How It Works section", () => {
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("Clone & Setup")).toBeInTheDocument();
    expect(screen.getByText("Customize")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
  });

  it("renders the footer with branding", () => {
    expect(
      screen.getByText(/Built with ❤️ using Next.js, TypeScript/i)
    ).toBeInTheDocument();
  });

  it("has proper navigation links in hero section", () => {
    const getStartedLinks = screen.getAllByRole("link", { name: /get started/i });
    const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
    
    // Check that we have the expected links
    expect(getStartedLinks.length).toBeGreaterThanOrEqual(1);
    expect(signInLinks.length).toBeGreaterThanOrEqual(1);
    
    // Check that at least one Get Started link goes to signup
    const signupLinks = getStartedLinks.filter(link => link.getAttribute("href") === "/signup");
    expect(signupLinks.length).toBeGreaterThan(0);
    
    // Check that at least one Sign In link goes to login
    const loginLinks = signInLinks.filter(link => link.getAttribute("href") === "/login");
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it("has proper navigation links in footer", () => {
    const footerLinks = screen.getAllByRole("link", { name: /sign in|get started/i });
    // Should have at least 2 sets of these links (hero + footer)
    expect(footerLinks.length).toBeGreaterThanOrEqual(4);
  });
});
