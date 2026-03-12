import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "@/components/Navbar";

const mockLogout = jest.fn();
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { email: "user@test.com" },
    logout: mockLogout,
  }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Navbar", () => {
  it("displays user email", () => {
    render(<Navbar />);
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("calls logout when Sign out is clicked", () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(mockLogout).toHaveBeenCalled();
  });

  it("has a link to dashboard", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /qr platform/i })).toHaveAttribute("href", "/dashboard");
  });
});
