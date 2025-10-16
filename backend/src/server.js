import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {console.log(`The server is running at port :${port}`)});
