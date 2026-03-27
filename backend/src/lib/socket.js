import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import verifyJwt from "../utils/verifyJwt.js";
import User from "../models/user.model.js";

dotenv.config();

export const app = express();
export const server = http.createServer(app);
export const wss = new WebSocketServer({ server });
const userSocket = new Map();

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, part) => {
    if (!part) return acc;

    const [key, ...value] = part.trim().split("=");

    if (!key) return acc;

    acc[key] = decodeURIComponent(value.join("="));
    return acc;
  }, {});
};

const isAllowedOrigin = (origin) => {
  const allowed = process.env.FRONTEND_URL;
  if (!allowed) return true;
  if (!origin) return false;
  return origin === allowed;
};

const addSocket = (userId, ws) => {

  let set = userSocket.get(userId);


  if (!set || set.size === 0) {
    set = new Set();
    userSocket.set(userId, set);
  }

  set.add(ws);

};

const removeSocket = (userId, ws) => {
  const set = userSocket.get(userId);
  if (!set) return;

  set.delete(ws);

  if (set.size === 0) {
    userSocket.delete(userId);
  }
};

export const sendToUser = (userId, payload) => {
  //Get the set of the user which contains all the stuff
  const set = userSocket.get(userId);

  if (!set || set.size === 0) return;

  const data = JSON.stringify(payload);

  //Every value of the set is giving us a websocket instance
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    } else {
      set.delete(ws);
      if (set.size === 0) userSocket.delete(userId);
    }
  }
};

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) ws.terminate();
    ws.isAlive = false;
    try {

      ws.ping();
    } catch { }
  })
}, 30000);

wss.on("close", () => { clearInterval(interval) });

wss.on("connection", async (ws, req) => {
  try {
    if (!isAllowedOrigin(req.headers.origin)) {
      ws.close(1008, "Invalid Origin");
      return;
    }

    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      ws.close(1008, "Unauthorized");
      return;
    }
    let decode;
    try {
      decode = verifyJwt(token);
    } catch (error) {
      ws.close(1008, "Invalid token");
      return;
    }

    const now = new Date();

    const user = await User.findOne({
      _id: decode.id,
      sessions: { $elemMatch: { token, expiresAt: { $gt: now } } }
    });

    if (!user) {
      ws.close(1008, "Session Expired");
      return;
    }

    const userId = user._id.toString();
    addSocket(userId, ws);

    console.log(`A user is connected to the socket server: ${userId}`);

    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`User ${userId}`, data);
      } catch {
        console.log(`Raw message from user ${userId}`, message.toString());

      }
    });

    ws.on("error", (error) => {
      console.error(`Socket error for user ${userId}: ${error}`);
    });

    ws.on("close", () => {
      console.log(`User ${userId} disconnected`);
      removeSocket(userId, ws);
    });


    ws.send(JSON.stringify({
      type: "connected",
      data: {
        _id: userId,
        message: "Welcome user"
      }
    }));

  } catch (error) {
    console.error("WebSocket Connection Error : ", error);
    ws.close(1011, "Internal error");
  }
});

