import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import path from "path";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import messageRouters from "./routes/message.route.js";

dotenv.config();

const app = express();
const __dirname = path.resolve();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRouters);

//Make this production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get(/.*/, (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`The server is running at port :${port}`);
  connectDb();
});
