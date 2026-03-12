import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockRegister = jest.fn();
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ register: mockRegister }),
}));

describe("RegisterPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders registration form fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("calls register and redirects on success", async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "new@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "securepass");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("new@example.com", "securepass");
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error when registration fails", async () => {
    const err = { response: { data: { error: "email already registered" } } };
    mockRegister.mockRejectedValueOnce(err);
    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "existing@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pass123");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("email already registered");
    });
  });

  it("has link to login page", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });
});
