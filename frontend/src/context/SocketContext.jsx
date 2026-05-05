import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from "../lib/api.js";
import { SocketContext } from "./socketContext.js";

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [retryCount, setRetryCount] = useState(0);
  const reconnectTimeoutRef = useRef(null);

  const refreshAuthUser = useCallback(async () => {
    try {
      const res = await api.get("/api/auth/me");
      if (res.data.success) {
        setAuthUser(res.data.user);
        return res.data.user;
      }
      setAuthUser(null);
      return null;
    } catch {
      setAuthUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshAuthUser();
  }, [refreshAuthUser]);

  useEffect(() => {
    if (!authUser) return;

    if (socketRef.current) return;

    const ws = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => {
      console.log(`Socket connected for user: ${authUser.id}`);
      setRetryCount(0);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      if (ws !== socketRef.current) return;

      try {
        const payload = JSON.parse(event.data);
        if (
          payload?.type === "message" &&
          (payload?.data?._id || payload?.data?.id)
        ) {
          setLastMessage(payload.data);
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////
        if (payload?.type === "presence:initial") {
          if (!Array.isArray(payload.data?.onlineUserIds)) return;

          setOnlineUsers(
            new Set((payload.data.onlineUserIds ?? []).map(String)),
          );
        }

        if (
          payload?.type === "presence:update" &&
          typeof payload.data?.isOnline === "boolean"
        ) {
          const id = String(payload?.data?.userId);

          setOnlineUsers((prev) => {
            const stuff = new Set(prev);

            if (payload?.data?.isOnline) {
              stuff.add(id);
            } else {
              stuff.delete(id);
            }
            return stuff;
          });
        }

        if (payload?.type === "presence:remove") {
          const id = String(payload?.data?.userId);
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }

        ///////////////////////////////////////////////////////////////////////////////////////////////
      } catch {
        console.log("Non-JSON socket payload:", event.data);
      }
    };

    ws.onclose = () => {
      if (socketRef.current !== ws) return;

      console.log(`Socket closed for user: ${authUser.id}`);
      setOnlineUsers(new Set());
      setSocket(null);
      socketRef.current = null;

      if (reconnectTimeoutRef.current) return;

      const delay = Math.min(1000 * 2 ** retryCount, 30000);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        setRetryCount((prev) => prev + 1);
      }, delay);
    };

    ws.onerror = () => {
      console.log(`Socket error for user: ${authUser.id}`);
    };

    return () => {
      ws.close();
      socketRef.current = null;
      setSocket(null);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [authUser, retryCount]);

  useEffect(() => {
    if (!authUser) {
      setRetryCount(0);
      setOnlineUsers(new Set());
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.curremt = null;
      }
    }
  }, [authUser]);

  const value = useMemo(
    () => ({
      socket,
      authUser,
      lastMessage,
      refreshAuthUser,
      onlineUsers,
    }),
    [socket, authUser, lastMessage, refreshAuthUser, onlineUsers],
  );
  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
