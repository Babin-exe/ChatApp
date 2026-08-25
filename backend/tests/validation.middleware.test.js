import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validate } from "../src/middleware/validate.middleware.js";
import { validateSendMessageBody } from "../src/middleware/validateSendMessageBody.middleware.js";

describe("validate middleware", () => {
  it("returns HttpError for invalid payload", () => {
    const schema = z.object({ name: z.string().min(2) });
    const middleware = validate(schema);

    const req = { body: { name: "a" } };
    const nextCalls = [];
    const next = (error) => nextCalls.push(error);

    middleware(req, {}, next);

    expect(nextCalls).toHaveLength(1);
    expect(nextCalls[0]).toBeTruthy();
    expect(nextCalls[0].status).toBe(400);
  });

  it("sanitizes and passes valid payload", () => {
    const schema = z.object({ name: z.string().trim().min(2) });
    const middleware = validate(schema);

    const req = { body: { name: "  Alex  " } };
    const nextCalls = [];
    const next = (error) => nextCalls.push(error);

    middleware(req, {}, next);

    expect(nextCalls).toEqual([undefined]);
    expect(req.body.name).toBe("Alex");
  });

  it("preserves reply target when validating message bodies", () => {
    const replyToMessageId = "507f1f77bcf86cd799439011";
    const req = {
      body: {
        content: "  replying to this  ",
        replyToMessageId,
      },
      file: undefined,
    };
    const nextCalls = [];
    const next = (error) => nextCalls.push(error);

    validateSendMessageBody(req, {}, next);

    expect(nextCalls).toEqual([undefined]);
    expect(req.body).toEqual({
      content: "replying to this",
      replyToMessageId,
    });
  });

  it("rejects invalid reply target ids", () => {
    const req = {
      body: {
        content: "Hello",
        replyToMessageId: "not-an-object-id",
      },
      file: undefined,
    };
    const nextCalls = [];
    const next = (error) => nextCalls.push(error);

    validateSendMessageBody(req, {}, next);

    expect(nextCalls).toHaveLength(1);
    expect(nextCalls[0].status).toBe(400);
  });
});
