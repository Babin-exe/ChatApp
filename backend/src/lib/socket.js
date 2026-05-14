import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import verifyJwt from "../utils/verifyJwt.js";
import User from "../models/user.model.js";
import Chat from "../models/Chat.js";
import Blocked from "../models/Block.js";

dotenv.config();
export const app = express();
export const server = http.createServer(app);
export const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });
const userSocket = new Map();
const contactsByUser = new Map();
const watchersByUser = new Map();
const lastSeen = new Map();

const fetchContacts = async (userId) => {
  const userIdString = userId.toString();

  const [chats, blockedByMe, blockedMe] = await Promise.all([
    Chat.find({
      members: userId,
      status: "accepted",
    }).select("members"),

    Blocked.distinct("blocked", { blocker: userId }),
    Blocked.distinct("blocker", { blocked: userId }),
  ]);

  const excludedUserIds = new Set([
    userIdString,
    ...blockedByMe.map((id) => id.toString()),
    ...blockedMe.map((id) => id.toString()),
  ]);

  const contacts = new Set();

  for (const chat of chats) {
    for (const member of chat.members) {
      const memberId = member.toString();

      if (!excludedUserIds.has(memberId)) {
        contacts.add(memberId);
      }
    }
  }

  return contacts;
};


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
  if (!allowed) return false;
  if (!origin) return false;
  return origin === allowed;
};

const addSocket = (userId, ws) => {
  let set = userSocket.get(userId);
  if (!set) {
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

  const set = userSocket.get(userId);

  if (!set) return;

  const data = JSON.stringify(payload);


  for (const ws of [...set]) {
    if (ws.readyState !== WebSocket.OPEN) {
      set.delete(ws);
      continue;
    }
    ws.send(data);
  }

  if (set.size === 0) {
    userSocket.delete(userId);
  }

};

export const isUserOnline = (userId) => {
  return userSocket.has(userId);
};

export const getOnlineUserIds = () => {
  return Array.from(userSocket.keys());
};

export const notifyWatchers = (userId, payload) => {
  const watchers = watchersByUser.get(userId);
  if (!watchers) return;

  for (const watcherId of watchers) {
    if (isUserOnline(watcherId)) sendToUser(watcherId, payload);
  }
};

export const cleanupUserGraph = (userId) => {

  const contacts = contactsByUser.get(userId);

  if (!contacts) {
    contactsByUser.delete(userId);
    return;
  }

  for (const contactId of contacts) {
    const watchers = watchersByUser.get(contactId);
    if (!watchers) continue;

    watchers.delete(userId);

    if (watchers.size === 0) {
      watchersByUser.delete(contactId);
    }

    const contactSet = contactsByUser.get(contactId);
    if (contactSet) {
      contactSet.delete(userId);
      if (contactSet.size === 0) contactsByUser.delete(contactId);
    }
  }
  contactsByUser.delete(userId);
};


export const onChatAccepted = (userIdA, userIdB) => {

  const a = String(userIdA);
  const b = String(userIdB);


  const linkPresence = (ownerId, contactId) => {

    if (!contactsByUser.has(ownerId)) {
      contactsByUser.set(ownerId, new Set());
    }


    contactsByUser.get(ownerId).add(contactId);
    if (!watchersByUser.has(contactId)) {
      watchersByUser.set(contactId, new Set());
    }
    watchersByUser.get(contactId).add(ownerId);
  };

  linkPresence(a, b);
  linkPresence(b, a);

  if (isUserOnline(b)) {
    sendToUser(a, {
      type: "presence:update",
      data: { userId: b, isOnline: true },
    });
  }

  if (isUserOnline(a)) {
    sendToUser(b, {
      type: "presence:update",
      data: { userId: a, isOnline: true },
    });
  }
};

export const onChatRelationRemoved = (userIdA, userIdB) => {

  const a = String(userIdA);
  const b = String(userIdB);


  const hadRelation = contactsByUser.get(a)?.has(b) ||
    contactsByUser.get(b)?.has(a);

  const unlinkPresence = (ownerId, contactId) => {

    const contacts = contactsByUser.get(ownerId);

    if (contacts) {
      contacts.delete(contactId);

      if (contacts.size === 0) {
        contactsByUser.delete(ownerId);
      }
    }

    const watchers = watchersByUser.get(contactId);

    if (watchers) {
      watchers.delete(ownerId);

      if (watchers.size === 0) {
        watchersByUser.delete(contactId);
      }
    }

  }

  unlinkPresence(a, b);
  unlinkPresence(b, a);


  if (!hadRelation) return;



  if (isUserOnline(a)) {

    sendToUser(a, {
      type: "presence:remove",
      data: {
        userId: b,
      }
    });

  }

  if (isUserOnline(b)) {
    sendToUser(b, {
      type: "presence:remove",
      data: {
        userId: a,
      }
    });
  }

};


const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    try {

      ws.ping();
    } catch { }
  });
}, 30000);

setInterval(() => {
  for (const [key, set] of [...watchersByUser.entries()]) {
    if (set.size === 0) watchersByUser.delete(key);
  }
}, 600000);

setInterval(() => {
  const now = Date.now();


  for (const [id, time] of [...lastSeen.entries()]) {

    if (userSocket.has(id)) continue;

    if (now - time > 30 * 60 * 1000) {
      cleanupUserGraph(id);
      lastSeen.delete(id);
    }
  }

}, 10 * 60 * 1000)


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

    if (!contactsByUser.has(userId)) {

      const contacts = await fetchContacts(userId);
      contactsByUser.set(userId, contacts);

      for (const contactId of contacts) {
        let watchers = watchersByUser.get(contactId);

        if (!watchers) {
          watchers = new Set();
          watchersByUser.set(contactId, watchers);
        }

        if (!watchers.has(userId))
          watchers.add(userId);

      }
    }

    const contacts = contactsByUser.get(userId) ?? new Set();
    const onlineContacts = [...contacts].filter(isUserOnline);


    console.log(`A user is connected to the socket server: ${userId}`);


    lastSeen.set(userId, Date.now());




    ws.send(
      JSON.stringify({
        type: "connected",
        data: {
          _id: userId,
          message: "Welcome user",
        },
      }),
    );



    ws.send(
      JSON.stringify({
        type: "presence:initial",
        data: {
          onlineUserIds: onlineContacts,
        },
      }),
    );

    const sockets = userSocket.get(userId);

    if (sockets && sockets.size === 1) {
      notifyWatchers(userId, {
        type: "presence:update",
        data: {
          userId,
          isOnline: true,
        },
      });
    }

    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
      lastSeen.set(userId, Date.now());
    });

    ws.on("message", async (message) => {
      try {

        const data = JSON.parse(message.toString());
        // console.log(`User ${userId}`, data);
        lastSeen.set(userId, Date.now());


        const type = data?.type;



        // safeSend({
        //   type: "typing:start",
        //   data: {
        //     toUserId,
        //   },
        // });

        if (type !== "typing:start" && type !== "typing:stop") return;


        const toUserId = String(data?.data?.toUserId || "");
        if (!toUserId || toUserId === userId) return;

        const chat = await Chat.findOne({
          members: { $all: [userId, toUserId] },
          status: "accepted"
        }).select("_id");

        if (!chat) return;

        const [blockedByMe, blockedMe] = await Promise.all([
          Blocked.exists({ blocker: userId, blocked: toUserId }),
          Blocked.exists({ blocker: toUserId, blocked: userId })
        ]);


        if (blockedByMe || blockedMe) return;

        sendToUser(toUserId, {
          type: "typing:update",
          data: {
            fromUserId: userId,
            isTyping: type === "typing:start",
            at: Date.now()
          }
        });



      } catch (error) {
        console.error("ws message handler error", error);
      }
    });

    ws.on("error", (error) => {
      console.error(`Socket error for user ${userId}: ${error} `);
    });

    ws.on("close", () => {
      console.log(`User ${userId} disconnected`);
      removeSocket(userId, ws);

      const socket = userSocket.get(userId);

      if (!socket || socket.size === 0) {
        lastSeen.set(userId, Date.now());
        notifyWatchers(userId, {
          type: "presence:update",
          data: {
            userId,
            isOnline: false
          }
        });

        contactsByUser.delete(userId);

      }

    });

  } catch (error) {
    console.error("WebSocket Connection Error : ", error);
    ws.close(1011, "Internal error");
  }
});

