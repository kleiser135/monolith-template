/// <reference types="@testing-library/jest-dom" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { deleteAccount } from "@/lib/actions";
import { toast } from "sonner";

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();

// Mock the next/navigation module completely
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
}));

// Mock the server action
vi.mock("@/lib/actions", () => ({
  deleteAccount: vi.fn(),
}));

// Mock the sonner toast library
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockDeleteAccount = vi.mocked(deleteAccount);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

describe("DeleteAccountDialog", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should render the dialog trigger button", () => {
    render(<DeleteAccountDialog />);
    expect(
      screen.getByRole("button", { name: /delete account/i })
    ).toBeInTheDocument();
  });

  it("should open the dialog when the trigger button is clicked", () => {
    render(<DeleteAccountDialog />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(
      screen.getByRole("heading", { name: /are you absolutely sure/i })
    ).toBeInTheDocument();
  });

  it("should show success toast and redirect on successful account deletion", async () => {
    mockDeleteAccount.mockResolvedValue({
      success: true,
      message: "Account deleted successfully.",
    });

    render(<DeleteAccountDialog />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Account deleted successfully."
      );
      expect(mockRouterPush).toHaveBeenCalledWith("/");
    });
  });

  it("should show an error toast on failed account deletion", async () => {
    mockDeleteAccount.mockResolvedValue({
      success: false,
      message: "Failed to delete account.",
    });

    render(<DeleteAccountDialog />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to delete account.");
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  it('should show "Deleting..." and be disabled while the action is pending', async () => {
    // Make the mock promise never resolve to simulate a pending state
    mockDeleteAccount.mockReturnValue(new Promise(() => {}));

    render(<DeleteAccountDialog />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(continueButton).toBeDisabled();
      expect(continueButton).toHaveTextContent(/deleting.../i);
    });
  });
}); 