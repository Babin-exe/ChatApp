import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/lib/socket.js";
import authRoutes from "../src/routes/auth.route.js";
import errorHandler from "../src/middleware/errorHandler.js";

app.use("/api/auth", authRoutes);
app.use(errorHandler);

describe("auth routes validation", () => {
  it("rejects invalid signup payload", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "A",
      email: "invalid",
      password: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects invalid login payload", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "wrong-email",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
