/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

// Mock the useTheme hook from next-themes
const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should render the toggle theme button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('should call setTheme with "light" when the Light menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const trigger = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(trigger);

    const lightMenuItem = await screen.findByRole("menuitem", { name: /light/i });
    await user.click(lightMenuItem);
    
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it('should call setTheme with "dark" when the Dark menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const trigger = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(trigger);

    const darkMenuItem = await screen.findByRole("menuitem", { name: /dark/i });
    await user.click(darkMenuItem);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it('should call setTheme with "system" when the System menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const trigger = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(trigger);

    const systemMenuItem = await screen.findByRole("menuitem", { name: /system/i });
    await user.click(systemMenuItem);
    
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
}); 