import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
  getQRCodes: jest.fn(),
  deleteQRCode: jest.fn(),
}));

import DashboardPage from "@/app/dashboard/page";
import { getQRCodes } from "@/lib/api";

const mockGetQRCodes = getQRCodes as jest.MockedFunction<typeof getQRCodes>;

const mockQRCodes = [
  { id: "1", label: "My Website", short_code: "abc123", scan_count: 42, destination_url: "https://example.com" },
  { id: "2", label: "LinkedIn", short_code: "def456", scan_count: 17, destination_url: "https://linkedin.com" },
];

describe("DashboardPage", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("renders QR code list after loading", async () => {
    mockGetQRCodes.mockResolvedValueOnce({ qr_codes: mockQRCodes });
    render(<DashboardPage />);
    await waitFor(() => { expect(screen.getByTestId("qr-list")).toBeInTheDocument(); });
    expect(screen.getByText("My Website")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders Edit and Delete buttons for each QR", async () => {
    mockGetQRCodes.mockResolvedValueOnce({ qr_codes: mockQRCodes });
    render(<DashboardPage />);
    await waitFor(() => { expect(screen.getAllByText("Edit")).toHaveLength(2); });
    expect(screen.getAllByText("Delete")).toHaveLength(2);
  });

  it("shows empty state when no QR codes", async () => {
    mockGetQRCodes.mockResolvedValueOnce({ qr_codes: [] });
    render(<DashboardPage />);
    await waitFor(() => { expect(screen.getByText(/No QR codes yet/i)).toBeInTheDocument(); });
  });

  it("shows error when API fails", async () => {
    mockGetQRCodes.mockRejectedValueOnce(new Error("Network error"));
    render(<DashboardPage />);
    await waitFor(() => { expect(screen.getByText("Network error")).toBeInTheDocument(); });
  });
});
