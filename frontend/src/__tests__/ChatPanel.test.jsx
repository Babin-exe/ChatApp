import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatPanel from "../pages/ChatPanel/ChatPanel.jsx";

const socketContextValue = {
  authUser: { id: "507f1f77bcf86cd799439011" },
  lastMessage: null,
  onlineUsers: new Set(),
  socket: null,
  typingUsers: new Map(),
  lastMessageStatus: null,
  openConversation: vi.fn(),
  lastReactionUpdate: null,
  editedMessage: null,
};

vi.mock("../context/socketContext.js", () => ({
  UseSocketContext: () => socketContextValue,
}));

vi.mock("../lib/api.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("ChatPanel", () => {
  beforeEach(() => {
    socketContextValue.openConversation.mockClear();
    vi.stubGlobal(
      "Audio",
      class {
        constructor() {
          this.paused = true;
          this.play = vi.fn(() => Promise.resolve());
          this.pause = vi.fn();
          this.currentTime = 0;
          this.loop = false;
          this.volume = 1;
        }
      }
    );
  });

  it("renders the empty state without an edited-message event", async () => {
    render(<ChatPanel selectedContact={null} />);

    expect(
      screen.getByText("Select a contact to start chatting.")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(socketContextValue.openConversation).toHaveBeenCalledWith(
        undefined
      );
    });
  });
});
