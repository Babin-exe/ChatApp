import { useState, useEffect, useRef } from "react";
import api from "../lib/api.js";
import { SocketContext } from "./socketContext.js";

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  const refreshAuthUser = async () => {
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
  };

  useEffect(() => {
    refreshAuthUser();
  }, []);

  useEffect(() => {
    if (authUser) {
      const ws = new WebSocket(import.meta.env.VITE_SOCKET_URL);

      ws.onopen = () => {
        console.log(`Socket connected for user: ${authUser.id}`);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            (payload?.type === "message" && payload?.data?._id) ||
            payload?.data?.id
          ) {
            setLastMessage(payload.data);
          }
        } catch {
          console.log("Non-JSON socket payload:", event.data);
        }
      };

      ws.onclose = () => {
        console.log(`Socket closed for user: ${authUser.id}`);
      };

      ws.onerror = () => {
        console.log(`Socket error for user: ${authUser.id}`);
      };

      socketRef.current = ws;
      setSocket(ws);

      return () => {
        ws.close();
        socketRef.current = null;
        setSocket(null);
      };
    } else {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider
      value={{ socket, authUser, lastMessage, refreshAuthUser }}
    >
      {children}
    </SocketContext.Provider>
  );
};
