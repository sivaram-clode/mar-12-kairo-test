import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  login: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  setToken: jest.fn(),
  isAuthenticated: jest.fn(() => false),
  getToken: jest.fn(() => null),
  removeToken: jest.fn(),
}));

import LoginPage from "@/app/login/page";
import { login } from "@/lib/api";

const mockLogin = login as jest.MockedFunction<typeof login>;

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form with email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByText(/Sign in to QR Platform/i)).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("email input has correct type", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("email-input")).toHaveAttribute("type", "email");
  });

  it("password input has correct type", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("password-input")).toHaveAttribute("type", "password");
  });

  it("shows register link", () => {
    render(<LoginPage />);
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  it("calls login API on submit", async () => {
    mockLogin.mockResolvedValueOnce({ token: "test-jwt-token" });
    render(<LoginPage />);

    await userEvent.type(screen.getByTestId("email-input"), "test@example.com");
    await userEvent.type(screen.getByTestId("password-input"), "password123");
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("shows error on login failure", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
    render(<LoginPage />);

    await userEvent.type(screen.getByTestId("email-input"), "bad@example.com");
    await userEvent.type(screen.getByTestId("password-input"), "wrongpass");
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
    });
  });
});
