/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AnimatedAuthContainer } from "./AnimatedAuthContainer";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

describe("AnimatedAuthContainer", () => {
  it("renders children content", () => {
    render(
      <AnimatedAuthContainer formKey="test-form">
        <div>Test Form Content</div>
      </AnimatedAuthContainer>
    );

    expect(screen.getByText("Test Form Content")).toBeInTheDocument();
  });

  it("renders logo and title by default", () => {
    render(
      <AnimatedAuthContainer formKey="test-form">
        <div>Test Content</div>
      </AnimatedAuthContainer>
    );

    expect(screen.getByAltText("App Logo")).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });

  it("hides logo when showLogo is false", () => {
    render(
      <AnimatedAuthContainer formKey="test-form" showLogo={false}>
        <div>Test Content</div>
      </AnimatedAuthContainer>
    );

    expect(screen.queryByAltText("App Logo")).not.toBeInTheDocument();
    expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(
      <AnimatedAuthContainer formKey="test-form" title="Custom Title">
        <div>Test Content</div>
      </AnimatedAuthContainer>
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(
      <AnimatedAuthContainer formKey="test-form">
        <div>Test Content</div>
      </AnimatedAuthContainer>
    );

    const authContainer = container.firstChild as HTMLElement;
    expect(authContainer).toHaveClass(
      "bg-slate-900/50",
      "backdrop-blur-md",
      "border",
      "border-slate-700/50",
      "rounded-3xl",
      "shadow-2xl",
      "flex-shrink-0",
      "overflow-hidden"
    );
  });

  it("renders with different formKey props", () => {
    const { rerender } = render(
      <AnimatedAuthContainer formKey="signin">
        <div>Sign In Form</div>
      </AnimatedAuthContainer>
    );

    expect(screen.getByText("Sign In Form")).toBeInTheDocument();

    rerender(
      <AnimatedAuthContainer formKey="signup">
        <div>Sign Up Form</div>
      </AnimatedAuthContainer>
    );

    expect(screen.getByText("Sign Up Form")).toBeInTheDocument();
  });
});
