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

  const [lastReactionUpdate, setLastReactionUpdate] = useState(null);

  const openConversation = useCallback((selectedContactId) => {
    const normalizeId = selectedContactId ? String(selectedContactId) : null;
    const ws = socketRef.current;
    if (ws?.readyState !== ws.OPEN) return;
    ws.send(
      JSON.stringify({
        type: "message:seen-late",
        data: { contactId: normalizeId },
      })
    );
  }, []);

  const selectedContactRef = useRef(null);

  const setSelectedContactInContext = useCallback((selectedContact) => {
    if (selectedContact) {
      selectedContactRef.current = selectedContact
        ? String(selectedContact || "")
        : null;
    }
  }, []);

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

        switch (payload?.type) {
          case "pong":
            return;

          case "message": {
            if (!(payload?.data?._id || payload?.data?.id)) break;

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

              ws.send(
                JSON.stringify({
                  type: "message:delivered",
                  data: {
                    from: authUser.id,
                    to: senderId,
                    _id: payload?.data._id,
                  },
                })
              );

              if (senderId === String(selectedContactRef.current || "")) {
                console.log("Is this running??");

                ws.send(
                  JSON.stringify({
                    type: "message:seen-instant",
                    data: {
                      from: authUser.id,
                      to: senderId,
                      _id: payload?.data?._id,
                    },
                  })
                );
              }
            }
            break;
          }

          case "presence:initial":
            if (!Array.isArray(payload.data?.onlineUserIds)) return;

            setOnlineUsers((prev) => {
              const next = new Set(prev);
              for (const id of payload.data.onlineUserIds) {
                next.add(String(id));
              }
              return next;
            });
            break;

          case "presence:update": {
            if (typeof payload.data?.isOnline !== "boolean") break;

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
            break;
          }

          case "presence:remove": {
            const id = String(payload?.data?.userId);
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            break;
          }

          case "typing:update": {
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
            break;
          }

          case "message:status":
            console.log("Update the status to delivered please ");
            console.log("Update stuff okay");
            console.log(payload);

            setLastMessageStatus({
              messageId: payload.data.messageId,
              status: payload.data.status,
              deliveredAt: payload.data.deliveredAt,
              eventId: crypto.randomUUID(),
            });
            break;

          case "message:reaction_updated": {
            setLastReactionUpdate(payload.data);
            break;
          }

          default:
            break;
        }
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
      openConversation,
      setSelectedContactInContext,
      lastReactionUpdate,
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
      setSelectedContactInContext,
      openConversation,
      lastReactionUpdate,
    ]
  );
  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
