/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import { vi, describe, beforeEach, it, expect } from "vitest";
import { AppHeader } from "./AppHeader";

// Mock child components that have their own complex logic or dependencies
vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle-mock" />,
}));

vi.mock("@/components/features/auth/logout-button/LogoutButton", () => ({
  LogoutButton: () => <button>Logout</button>,
}));

// Mock the dropdown menu to simulate it being open
vi.mock("@/components/ui/dropdown-menu/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, asChild, ...props }: any) => 
    asChild ? children : <div data-testid="dropdown-item" {...props}>{children}</div>,
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) =>
    asChild ? children : <div data-testid="dropdown-trigger" {...props}>{children}</div>,
}));

describe("AppHeader", () => {
  describe("when the user is logged in", () => {
    beforeEach(() => {
      render(<AppHeader isLoggedIn={true} />);
    });

    it("should display links for authenticated users", () => {
      expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
      
      // Check for profile link in the dropdown (mocked as always visible)
      expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });

    it("should not display links for public users", () => {
      expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /sign up/i })).not.toBeInTheDocument();
    });

    it("should always display the theme toggle", () => {
      // Check for theme toggle in dropdown (mocked as always visible)
      expect(screen.getByTestId("theme-toggle-mock")).toBeInTheDocument();
    });
  });

  describe("when the user is logged out", () => {
    beforeEach(() => {
      render(<AppHeader isLoggedIn={false} />);
    });

    it("should display links for public users", () => {
      expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    });

    it("should not display links for authenticated users", () => {
      expect(screen.queryByRole("link", { name: /dashboard/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /profile/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
    });

    it("should always display the theme toggle", () => {
      expect(screen.getByTestId("theme-toggle-mock")).toBeInTheDocument();
    });
  });
}); 