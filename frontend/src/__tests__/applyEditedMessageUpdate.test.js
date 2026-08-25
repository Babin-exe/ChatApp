import { describe, expect, it } from "vitest";
import { applyEditedMessageUpdate } from "../pages/ChatPanel/utils/applyEditedMessageUpdate.js";

describe("applyEditedMessageUpdate", () => {
  it("returns original messages when edited payload has no messageId", () => {
    const messages = [{ _id: "1", content: "hello" }];

    expect(applyEditedMessageUpdate(messages, {})).toBe(messages);
  });

  it("updates only the matching message", () => {
    const messages = [
      { _id: "1", content: "hello", edited: false, updatedAt: "old-1" },
      { _id: "2", content: "world", edited: false, updatedAt: "old-2" },
    ];

    const updated = applyEditedMessageUpdate(messages, {
      messageId: "2",
      content: "updated",
      edited: true,
      updatedAt: "new-2",
    });

    expect(updated).toEqual([
      { _id: "1", content: "hello", edited: false, updatedAt: "old-1" },
      { _id: "2", content: "updated", edited: true, updatedAt: "new-2" },
    ]);
  });
});
