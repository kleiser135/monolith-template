/// <reference types="@testing-library/jest-dom" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { LogoutButton } from "./LogoutButton";
import { logout } from "@/lib/actions";

// Mock the next/navigation module
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock the server action
vi.mock("@/lib/actions", () => ({
  logout: vi.fn(),
}));

const mockLogout = vi.mocked(logout);

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the logout button", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("should call the logout action and refresh the router on click", async () => {
    mockLogout.mockResolvedValue(); // It's an async function

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/');
    });
  });

  it('should show "Logging out..." and be disabled while pending', async () => {
    // Make the mock promise never resolve to simulate a pending state
    mockLogout.mockReturnValue(new Promise(() => {}));

    render(<LogoutButton />);
    const button = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/logging out.../i);
    });
  });
}); 