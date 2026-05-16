import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/lib/socket.js";
import authRoutes from "../src/routes/auth.route.js";
import errorHandler from "../src/middleware/errorHandler.js";

app.use("/api/auth", authRoutes);
app.use(errorHandler);

describe("auth routes validation", () => {
  beforeEach(() => {
    process.env.ARCJET_KEY = "";
  });

  it("rejects missing Google credential", async () => {
    const response = await request(app)
      .post("/api/auth/google")
      .set("user-agent", "vitest")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("does not expose manual signup or login routes", async () => {
    const signupResponse = await request(app)
      .post("/api/auth/signup")
      .set("user-agent", "vitest")
      .send({});

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .set("user-agent", "vitest")
      .send({});

    expect(signupResponse.status).toBe(404);
    expect(loginResponse.status).toBe(404);
  });
});
