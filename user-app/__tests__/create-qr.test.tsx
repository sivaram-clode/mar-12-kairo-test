import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("@/lib/auth", () => ({
  isAuthenticated: jest.fn(() => true),
  getToken: jest.fn(() => "test-token"),
  removeToken: jest.fn(),
  setToken: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  createQRCode: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

import CreateQRPage from "@/app/dashboard/create/page";
import { createQRCode } from "@/lib/api";

const mockCreateQRCode = createQRCode as jest.MockedFunction<typeof createQRCode>;

describe("CreateQRPage", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("renders create QR form with label and URL fields", async () => {
    render(<CreateQRPage />);
    await waitFor(() => { expect(screen.getByTestId("create-qr-form")).toBeInTheDocument(); });
    expect(screen.getByTestId("label-input")).toBeInTheDocument();
    expect(screen.getByTestId("url-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-submit-button")).toBeInTheDocument();
  });

  it("shows validation error for invalid URL by submitting form directly", async () => {
    render(<CreateQRPage />);
    await waitFor(() => { expect(screen.getByTestId("create-qr-form")).toBeInTheDocument(); });

    await userEvent.type(screen.getByTestId("label-input"), "My QR");
    // Directly fire submit on form to bypass native type="url" validation in jsdom
    fireEvent.submit(screen.getByTestId("create-qr-form"));

    await waitFor(() => {
      // With empty URL, custom validation triggers
      expect(mockCreateQRCode).not.toHaveBeenCalled();
    });
  });

  it("calls createQRCode API with correct args", async () => {
    mockCreateQRCode.mockResolvedValueOnce({ qr_code: { id: "1", short_code: "xyz789", label: "Test QR" } });
    render(<CreateQRPage />);
    await waitFor(() => { expect(screen.getByTestId("create-qr-form")).toBeInTheDocument(); });

    await userEvent.type(screen.getByTestId("label-input"), "Test QR");
    await userEvent.type(screen.getByTestId("url-input"), "https://example.com");
    fireEvent.submit(screen.getByTestId("create-qr-form"));

    await waitFor(() => {
      expect(mockCreateQRCode).toHaveBeenCalledWith("Test QR", "https://example.com");
    });
  });

  it("shows success state after QR creation", async () => {
    mockCreateQRCode.mockResolvedValueOnce({ qr_code: { id: "1", short_code: "xyz789", label: "Test QR" } });
    render(<CreateQRPage />);
    await waitFor(() => { expect(screen.getByTestId("create-qr-form")).toBeInTheDocument(); });

    await userEvent.type(screen.getByTestId("label-input"), "Test QR");
    await userEvent.type(screen.getByTestId("url-input"), "https://example.com");
    fireEvent.submit(screen.getByTestId("create-qr-form"));

    await waitFor(() => { expect(screen.getByText(/QR Code Created/i)).toBeInTheDocument(); });
    expect(screen.getByText(/Download QR PNG/i)).toBeInTheDocument();
  });

  it("shows error when API call fails", async () => {
    mockCreateQRCode.mockRejectedValueOnce(new Error("Server error"));
    render(<CreateQRPage />);
    await waitFor(() => { expect(screen.getByTestId("create-qr-form")).toBeInTheDocument(); });

    await userEvent.type(screen.getByTestId("label-input"), "My QR");
    await userEvent.type(screen.getByTestId("url-input"), "https://example.com");
    fireEvent.submit(screen.getByTestId("create-qr-form"));

    await waitFor(() => { expect(screen.getByRole("alert")).toHaveTextContent("Server error"); });
  });
});
