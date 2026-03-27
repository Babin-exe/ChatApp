import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Login from "../pages/Login/Login.jsx";

vi.mock("../lib/api.js", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("../context/socketContext.js", () => ({
  UseSocketContext: () => ({
    refreshAuthUser: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import api from "../lib/api.js";

describe("Login page", () => {
  it("renders login form", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("submits login form", async () => {
    api.post.mockResolvedValueOnce({
      data: { success: true, message: "Login successful" },
    });
    api.get.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "strongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/auth/login", {
        email: "john@example.com",
        password: "strongpassword",
      });
    });
  });
});
