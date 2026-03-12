import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateQRForm from "@/components/CreateQRForm";

jest.mock("@/lib/api", () => ({
  createQRCode: jest.fn(),
}));
import { createQRCode } from "@/lib/api";
const mockCreate = createQRCode as jest.Mock;

const mockQR = {
  id: 1,
  code: "abc-123",
  label: "My QR",
  destination_url: "https://example.com",
  image_path: null,
  is_active: true,
  user_id: 1,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("CreateQRForm", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows create button initially", () => {
    render(<CreateQRForm onCreated={jest.fn()} />);
    expect(screen.getByRole("button", { name: /new qr code/i })).toBeInTheDocument();
  });

  it("opens form when button clicked", async () => {
    render(<CreateQRForm onCreated={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /new qr code/i }));
    expect(screen.getByLabelText(/destination url/i)).toBeInTheDocument();
  });

  it("calls createQRCode with correct args and invokes onCreated", async () => {
    mockCreate.mockResolvedValueOnce({ data: mockQR });
    const onCreated = jest.fn();
    render(<CreateQRForm onCreated={onCreated} />);

    await userEvent.click(screen.getByRole("button", { name: /new qr code/i }));
    await userEvent.type(screen.getByLabelText(/label/i), "My QR");
    await userEvent.type(screen.getByLabelText(/destination url/i), "https://example.com");
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith("My QR", "https://example.com");
      expect(onCreated).toHaveBeenCalledWith(mockQR);
    });
  });

  it("shows error when API fails", async () => {
    mockCreate.mockRejectedValueOnce({ response: { data: { error: "destination_url is required" } } });
    render(<CreateQRForm onCreated={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /new qr code/i }));
    await userEvent.type(screen.getByLabelText(/destination url/i), "https://bad");
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("destination_url is required");
    });
  });

  it("closes form on cancel", async () => {
    render(<CreateQRForm onCreated={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /new qr code/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByLabelText(/destination url/i)).not.toBeInTheDocument();
  });
});
