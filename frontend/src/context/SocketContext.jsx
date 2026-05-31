/*
We need to keep track of few stuffs 

1) What was the last time some stuff happended (Last activity tracker)
2) Periodic Health check 
3) If some kind of network change is detected force the browser to re-connect 
4) I need better socket creation guard 
5) Activity will reset on events : Message arrives or Connection opened -> (lastSocketEventRef = now )
6) Cleanup of the health system : stop interval , clear timers , clear sockets 
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

import api from "../lib/api.js";
import { SocketContext } from "./socketContext.js";

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [retryCount, setRetryCount] = useState(0);
  const reconnectTimeoutRef = useRef(null);

  const shouldReconnectRef = useRef(true);

  const stopClearingOnlineUsersRef = useRef(null);

  const lastSocketEventRef = useRef(Date.now());

  const socketHealthIntervalRef = useRef(null);

  const [typingUsers, setTypingUsers] = useState(new Map());

  const [lastMessageStatus, setLastMessageStatus] = useState(null);

  //

  /*
   set a Timeout in ws.close()
   make sure to get rid of that timer if we connect on time in ws.onopen()
   remove the setTimeout reference from stopClearingOnlineUserRef.current once the function runs successfully so we dont have the old id after the fn runs
when the component unmounting happens we will clear the timeout and make the reference null
  */

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
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      socketRef.current?.close();
      socketRef.current = null;
      setSocket(null);
      setRetryCount((prev) => prev + 1);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setTypingUsers((prev) => {
        if (prev.size === 0) return prev;

        let changed = false;
        const next = new Map(prev);
        for (const [userId, timestamp] of prev.entries()) {
          if (now - timestamp > 3000) {
            next.delete(userId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    refreshAuthUser();
  }, [refreshAuthUser]);

  useEffect(() => {
    if (!authUser) return;

    shouldReconnectRef.current = true;

    if (
      socketRef.current &&
      (socketRef.current?.readyState === WebSocket.OPEN ||
        socketRef.current?.readyState === WebSocket.CONNECTING)
    )
      return;

    const ws = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`Socket connected for user: ${authUser.id}`);
      setSocket(ws);
      setRetryCount(0);
      lastSocketEventRef.current = Date.now();

      socketHealthIntervalRef.current = setInterval(() => {
        const st = socketRef.current;
        if (!st || st.readyState !== WebSocket.OPEN) return;

        const timeSinceLastEvent = Date.now() - lastSocketEventRef.current;

        if (timeSinceLastEvent > 40000) {
          st.send(JSON.stringify({ type: "ping" }));
        }

        if (timeSinceLastEvent > 45000) {
          st.close();
        }
      }, 5000);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (stopClearingOnlineUsersRef.current) {
        clearTimeout(stopClearingOnlineUsersRef.current);
        stopClearingOnlineUsersRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      if (ws !== socketRef.current) return;

      try {
        lastSocketEventRef.current = Date.now();
        const payload = JSON.parse(event.data);

        if (payload?.type === "pong") return;
        if (
          payload?.type === "message" &&
          (payload?.data?._id || payload?.data?.id)
        ) {
          setLastMessage(payload.data);

          const senderId = String(payload.data.senderId || "");

          if (senderId) {
            setOnlineUsers((prev) => {
              if (!prev.has(senderId)) {
                const next = new Set(prev);
                next.add(senderId);
                return next;
              }
              return prev;
            });

            //so here when a message arrives we update stuff , and this is the place where we are sure
            //that a message has come to us for sure so from here we can acknowledge the sender of this message

            ws.send(
              JSON.stringify({
                type: "message:delivered",
                data: {
                  from: authUser.id,
                  to: senderId,
                  _id: payload?.data._id,
                },
              }),
            );

            /////////////////////////////////////////////////////////////////////////////////
          }
        }

        ///////////////////////////////////////////////////////////////////////////////////////////////
        if (payload?.type === "presence:initial") {
          if (!Array.isArray(payload.data?.onlineUserIds)) return;

          setOnlineUsers((prev) => {
            const next = new Set(prev);
            for (const id of payload.data.onlineUserIds) {
              next.add(String(id));
            }
            return next;
          });
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

        if (payload?.type === "typing:update") {
          const fromUserId = String(payload?.data?.fromUserId || "");
          const isTyping = payload?.data?.isTyping;

          if (!fromUserId || typeof isTyping !== "boolean") return;

          setOnlineUsers((prev) => {
            if (!prev.has(fromUserId)) {
              const next = new Set(prev);
              next.add(fromUserId);
              return next;
            }
            return prev;
          });

          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (isTyping) next.set(fromUserId, Date.now());
            else next.delete(fromUserId);
            return next;
          });
        }

        if (payload?.type === "message:status") {
          console.log("Update the status to delivered please ");

          // Now we shoudl update the message array , and that too the one which has the message id of what the response came as and also make that
          //record status to be delivered that would cause the message array to be re rendered and i am done i guess

          //How do you update this stuff is what i have to figure it out

          console.log("Update stuff okay");

          console.log(payload);
          setLastMessageStatus({
            messageId: payload.data.messageId,
            status: payload.data.status,
            deliveredAt: payload.data.deliveredAt,
            eventId: crypto.randomUUID(),
          });
        }

        ///////////////////////////////////////////////////////////////////////////////////////////////
      } catch {
        console.log("Non-JSON socket payload:", event.data);
      }
    };

    ws.onclose = () => {
      if (socketRef.current !== ws) return;
      if (!shouldReconnectRef.current) return;

      console.log(`Socket closed for user: ${authUser.id}`);

      setSocket(null);
      socketRef.current = null;

      if (!stopClearingOnlineUsersRef.current) {
        stopClearingOnlineUsersRef.current = setTimeout(() => {
          console.log("we are clearing the online users");
          setOnlineUsers(new Set());
          stopClearingOnlineUsersRef.current = null;
        }, 10000);
      }

      if (reconnectTimeoutRef.current) return;

      const delay = Math.min(1000 * 2 ** retryCount, 30000);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        setRetryCount((prev) => prev + 1);
      }, delay);

      if (socketHealthIntervalRef.current) {
        clearInterval(socketHealthIntervalRef.current);
        socketHealthIntervalRef.current = null;
      }

      setTypingUsers(new Map());
    };

    ws.onerror = () => {
      console.log(`Socket error for user: ${authUser.id}`);
      ws.close();
    };

    return () => {
      shouldReconnectRef.current = false;

      socketRef.current = null;
      ws.close();
      setSocket(null);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (stopClearingOnlineUsersRef.current) {
        clearTimeout(stopClearingOnlineUsersRef.current);
        stopClearingOnlineUsersRef.current = null;
      }

      if (socketHealthIntervalRef.current) {
        clearInterval(socketHealthIntervalRef.current);
        socketHealthIntervalRef.current = null;
      }
    };
  }, [authUser, retryCount]);

  useEffect(() => {
    if (!authUser) {
      setRetryCount(0);
      setOnlineUsers(new Set());
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (stopClearingOnlineUsersRef.current) {
        clearTimeout(stopClearingOnlineUsersRef.current);
        stopClearingOnlineUsersRef.current = null;
      }

      if (socketHealthIntervalRef.current) {
        clearInterval(socketHealthIntervalRef.current);
        socketHealthIntervalRef.current = null;
      }

      setTypingUsers(new Map());
    }
  }, [authUser]);

  const value = useMemo(
    () => ({
      socket,
      authUser,
      authLoading,
      lastMessage,
      refreshAuthUser,
      onlineUsers,
      typingUsers,
      lastMessageStatus,
    }),
    [
      socket,
      authUser,
      authLoading,
      lastMessage,
      refreshAuthUser,
      onlineUsers,
      typingUsers,
      lastMessageStatus,
    ],
  );
  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
