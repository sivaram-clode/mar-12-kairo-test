import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QRCard from "@/components/QRCard";

jest.mock("@/lib/api", () => ({
  updateQRCode: jest.fn(),
  deleteQRCode: jest.fn(),
  getQRImageUrl: jest.fn(() => "http://localhost:5000/api/qr/1/image"),
}));
import { updateQRCode, deleteQRCode } from "@/lib/api";
const mockUpdate = updateQRCode as jest.Mock;
const mockDelete = deleteQRCode as jest.Mock;

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockQR = {
  id: 1,
  code: "abc-123-def-456",
  label: "Test QR",
  destination_url: "https://example.com",
  image_path: "/static/qr/abc.png",
  is_active: true,
  user_id: 1,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("QRCard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("displays label and destination URL", () => {
    render(<QRCard qr={mockQR} onUpdated={jest.fn()} onDeleted={jest.fn()} />);
    expect(screen.getByText("Test QR")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com" })).toBeInTheDocument();
  });

  it("shows Active badge for active QR", () => {
    render(<QRCard qr={mockQR} onUpdated={jest.fn()} onDeleted={jest.fn()} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows edit form when Edit clicked", async () => {
    render(<QRCard qr={mockQR} onUpdated={jest.fn()} onDeleted={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("calls updateQRCode on save", async () => {
    const updated = { ...mockQR, destination_url: "https://new.com" };
    mockUpdate.mockResolvedValueOnce({ data: updated });
    const onUpdated = jest.fn();
    render(<QRCard qr={mockQR} onUpdated={onUpdated} onDeleted={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /edit/i }));
    const urlInput = screen.getAllByRole("textbox").find((el) =>
      (el as HTMLInputElement).value === "https://example.com"
    )!;
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, "https://new.com");
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(onUpdated).toHaveBeenCalledWith(updated);
    });
  });

  it("calls deleteQRCode and onDeleted on delete confirm", async () => {
    mockDelete.mockResolvedValueOnce({});
    const onDeleted = jest.fn();
    window.confirm = jest.fn(() => true);
    render(<QRCard qr={mockQR} onUpdated={jest.fn()} onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(onDeleted).toHaveBeenCalledWith(1);
    });
  });

  it("does not delete when confirm is cancelled", async () => {
    window.confirm = jest.fn(() => false);
    render(<QRCard qr={mockQR} onUpdated={jest.fn()} onDeleted={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("has a Stats link pointing to stats page", () => {
    render(<QRCard qr={mockQR} onUpdated={jest.fn()} onDeleted={jest.fn()} />);
    expect(screen.getByRole("link", { name: /stats/i })).toHaveAttribute("href", "/dashboard/1/stats");
  });
});
