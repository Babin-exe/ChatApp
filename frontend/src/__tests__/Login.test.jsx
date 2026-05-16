import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "../pages/Login/Login.jsx";

vi.mock("../lib/api.js", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button
      type="button"
      onClick={() => onSuccess({ credential: "fake-google-token" })}
    >
      Continue with Google
    </button>
  ),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Google auth entry", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Continue to ChatApplication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
  });

  it("submits Google credential", async () => {
    api.post.mockResolvedValueOnce({
      data: { success: true, message: "Login successful" },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/auth/google", {
        credential: "fake-google-token",
      });
    });
  });
});
