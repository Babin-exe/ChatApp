import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import "./ChatPanel.css";
import api from "../../lib/api.js";
import axios from "axios";
import { useRef } from "react";
import { UseSocketContext } from "../../context/socketContext.js";

const isRequestCanceled = (err) =>
  axios.isCancel(err) ||
  err?.code === "ERR_CANCELED" ||
  err?.name === "CanceledError" ||
  err?.name === "AbortError";

const ChatPanel = ({
  selectedContact,
  onUnblockUser,
  actionLoadingId,
  blockedUsers = [],
  onBack,
}) => {
  const { authUser, lastMessage, onlineUsers, socket } = UseSocketContext();

  const normalizeId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value._id || value.id || "";
  };

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [sendError, setSendError] = useState("");
  const [retryMessage, setRetryMessage] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const isTypingRef = useRef(false);
  const typingIdleTimeoutRef = useRef(null);
  const TYPING_IDLE_MS = 1200;

  /*
  


  what do i want 

  when the we detect some changes in the input tag 

  we will try to send some ws event to the server 
  but doing it in every key stroke will make the server over load 
  so how do we prevent that , lets try to do something like :

  when an event comes check if there is already typing emitted if it is then 
  we must knwo one timer is already started which will emit stop after lets say x second 
  so our job is to just reset the timer 
  but if it is the first time we are emitting we will now create a fresh timer event that will 
  in some x time send stop signal through the socket 

  
  */

  const [chatStatus, setChatStatus] = useState({
    blockedByMe: false,
    blockedMe: false,
    canMessage: true,
  });

  const [statusLoading, setStatusLoading] = useState(false);
  const chatStreamRef = useRef(null);
  const isInitialLoadDone = useRef(false);
  const activeMessagesContactIdRef = useRef(null);
  const myUserId = normalizeId(authUser);
  const selectedContactId = selectedContact?._id;
  const selectedContactIsOnline = Boolean(
    selectedContactId && onlineUsers?.has(String(selectedContactId)),
  );
  const lastTypedUserRef = useRef(null);

  const getSenderId = (message) => {
    if (!message?.senderId) return "";
    return typeof message.senderId === "string"
      ? message.senderId
      : message.senderId._id;
  };

  const loadMessages = useCallback(async (contactId, signal) => {
    try {
      setLoadingMessages(true);
      setMessagesError("");

      const res = await api.get(`/api/chats/messages/${contactId}`, {
        signal,
      });

      if (activeMessagesContactIdRef.current !== contactId) return;

      setMessages(res.data.data || []);
      setNextCursor(res.data.nextCursor || null);

      setTimeout(() => {
        if (activeMessagesContactIdRef.current !== contactId) return;
        const el = chatStreamRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
        isInitialLoadDone.current = true;
      }, 50);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      if (activeMessagesContactIdRef.current !== contactId) return;

      const message =
        err.response?.data?.message || "Failed to load messages. Please retry.";
      setMessagesError(message);
      toast.error(message);
    } finally {
      if (activeMessagesContactIdRef.current === contactId) {
        setLoadingMessages(false);
      }
    }
  }, []);

  const reloadMessages = useCallback(async () => {
    if (!selectedContactId) return;
    await loadMessages(selectedContactId);
  }, [selectedContactId, loadMessages]);

  const fetchOlderMessages = useCallback(async () => {
    if (!nextCursor || loadingOlder || !selectedContactId) return;

    const contactId = selectedContactId;

    try {
      setLoadingOlder(true);
      const el = chatStreamRef.current;
      const prevScrollHeight = el ? el.scrollHeight : 0;
      const res = await api.get(
        `/api/chats/messages/${contactId}?cursor=${nextCursor}`,
      );

      if (activeMessagesContactIdRef.current !== contactId) return;

      const olderMessages = res.data.data || [];
      setNextCursor(res.data.nextCursor || null);
      setMessages((prev) => {
        const seen = new Set(prev.map((message) => message._id));
        const uniqueOlder = olderMessages.filter(
          (message) => !seen.has(message._id),
        );
        return [...uniqueOlder, ...prev];
      });
      setTimeout(() => {
        if (activeMessagesContactIdRef.current !== contactId) return;
        if (el) {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight;
        }
      }, 30);
    } catch {
      if (activeMessagesContactIdRef.current === contactId) {
        toast.error("Failed to load older messages. Please retry.");
      }
    } finally {
      if (activeMessagesContactIdRef.current === contactId) {
        setLoadingOlder(false);
      }
    }
  }, [nextCursor, loadingOlder, selectedContactId]);

  const handleScroll = useCallback(() => {
    const el = chatStreamRef.current;

    if (!el || !isInitialLoadDone.current) return;

    if (el.scrollTop < 50 && nextCursor && !loadingOlder) {
      fetchOlderMessages();
    }
  }, [nextCursor, loadingOlder, fetchOlderMessages]);

  const safeSend = useCallback(
    (payload) => {
      if (!socket) return;
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify(payload));
    },
    [socket],
  );

  const clearTypingTimer = useCallback(() => {
    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
      typingIdleTimeoutRef.current = null;
    }
  });

  /* 
  
  what should be done here is debouncing is what i want to do here ...  

  if a user is typing for the first time i want to emit a web socket event and then 
  start a timer that will expire in x amount of time and tell the ui or what ever to stop
  if typing already started we dont send anything just restart the timer which 
  is responsible for stopping the typing

  so this is the core idea of our stuff 

 
  */

  const stopTyping = useCallback(() => {
    const targetUserId = lastTypedUserRef.current;

    if (!targetUserId) return;
    if (!isTypingRef.current) return;

    safeSend({ type: "typing:stop", data: { to: targetUserId } });

    isTypingRef.current = false;
    lastTypedUserRef.current = null;

    clearTypingTimer();
  }, [selectedContactId, safeSend]);

  const handleTyping = useCallback(
    (value) => {
      if (!selectedContactId) return;

      const isEmpty = value.trim() === "";
      if (isEmpty) {
        stopTyping();
        return;
      }

      if (
        lastTypedUserRef.current &&
        lastTypedUserRef.current !== selectedContactId
      ) {
        stopTyping();
      }

      if (!isTypingRef.current) {
        safeSend({ type: "typing:start", data: { to: selectedContactId } });
        isTypingRef.current = true;
        lastTypedUserRef.current = selectedContactId;
      }

      clearTypingTimer();

      typingIdleTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, TYPING_IDLE_MS);
    },
    [stopTyping, selectedContactId, safeSend],
  );

  const defaultStatusFromBlockedList = useMemo(() => {
    const isBlockedByMe = blockedUsers.some(
      (entry) => entry?.blocked?._id === selectedContact?._id,
    );

    return {
      blockedByMe: isBlockedByMe,
      blockedMe: false,
      canMessage: !isBlockedByMe,
    };
  }, [blockedUsers, selectedContact]);

  useEffect(() => {
    if (!selectedContactId) {
      activeMessagesContactIdRef.current = null;
      setMessages([]);
      setMessagesError("");
      setSendError("");
      setRetryMessage("");
      setNextCursor(null);
      setChatStatus({
        blockedByMe: false,
        blockedMe: false,
        canMessage: true,
      });
      isInitialLoadDone.current = false;
      return;
    }

    const contactId = selectedContactId;
    activeMessagesContactIdRef.current = contactId;

    setMessages([]);
    setNextCursor(null);
    setMessagesError("");
    setSendError("");
    setRetryMessage("");
    isInitialLoadDone.current = false;
    setChatStatus(defaultStatusFromBlockedList);

    const controller = new AbortController();
    loadMessages(contactId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [selectedContactId, defaultStatusFromBlockedList, loadMessages]);

  useEffect(() => {
    const contactId = selectedContactId;
    if (!contactId) return;

    const controller = new AbortController();

    const fetchChatStatus = async () => {
      try {
        setStatusLoading(true);

        const res = await api.get(`/api/chats/status/${contactId}`, {
          signal: controller.signal,
        });

        const status = res.data?.status;
        if (!status) return;

        if (activeMessagesContactIdRef.current !== contactId) return;

        setChatStatus({
          blockedByMe: Boolean(status.blockedByMe),
          blockedMe: Boolean(status.blockedMe),
          canMessage: Boolean(status.canMessage),
        });
      } catch (err) {
        if (isRequestCanceled(err)) return;
        if (activeMessagesContactIdRef.current !== contactId) return;

        setChatStatus(defaultStatusFromBlockedList);
      } finally {
        if (activeMessagesContactIdRef.current === contactId) {
          setStatusLoading(false);
        }
      }
    };

    fetchChatStatus();

    return () => {
      controller.abort();
    };
  }, [selectedContactId, defaultStatusFromBlockedList]);

  useEffect(() => {
    if (!selectedContact || !lastMessage || !myUserId) return;

    const senderId = normalizeId(lastMessage.senderId);
    const receiverId = normalizeId(lastMessage.receiverId);

    const belongsToOpenChat =
      (senderId === myUserId && receiverId === selectedContact._id) ||
      (senderId === selectedContact._id && receiverId === myUserId);

    if (!belongsToOpenChat) return;

    const contactId = selectedContact._id;

    setMessages((prev) => {
      if (activeMessagesContactIdRef.current !== contactId) return prev;
      if (prev.some((m) => m._id === lastMessage._id)) return prev;
      return [...prev, lastMessage];
    });

    setTimeout(() => {
      if (activeMessagesContactIdRef.current !== contactId) return;
      const el = chatStreamRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 30);
  }, [lastMessage, selectedContact, myUserId]);

  useEffect(() => {
    return () => {
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
        typingIdleTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  const sendCurrentMessage = async (contentToSend) => {
    if (!selectedContact || !contentToSend.trim()) return;
    if (!chatStatus.canMessage) {
      toast.error("You can't message this user");
      return;
    }

    const contactId = selectedContact._id;

    try {
      setSending(true);
      setSendError("");

      const res = await api.post(`/api/messages/send/${contactId}`, {
        content: contentToSend,
        type: "text",
      });

      const savedMessage = res.data.messageData;
      if (!savedMessage?._id) {
        throw new Error("Invalid send response");
      }

      if (activeMessagesContactIdRef.current !== contactId) return;

      setMessages((prev) => {
        if (prev.some((message) => message._id === savedMessage._id))
          return prev;
        return [...prev, savedMessage];
      });

      setTimeout(() => {
        if (activeMessagesContactIdRef.current !== contactId) return;
        const el = chatStreamRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 50);

      setRetryMessage("");

      if (newMessage.trim() === contentToSend) {
        setNewMessage("");
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to send message. Please retry.";
      setSendError(message);
      setRetryMessage(contentToSend);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    stopTyping();
    await sendCurrentMessage(content);
  };

  if (!selectedContact) {
    return (
      <section className="chat-panel chat-empty">
        <p>Select a contact to start chatting.</p>
      </section>
    );
  }

  const isBlockedByMe = chatStatus.blockedByMe;
  const canMessage = chatStatus.canMessage;
  const unblockKey = `unblock-${selectedContact._id}`;
  const unblocking = actionLoadingId === unblockKey;
  const blockMessage = isBlockedByMe
    ? "You blocked this user. Unblock to send messages."
    : "You can't message this user.";

  const handleUnblock = async () => {
    if (!onUnblockUser) return;
    const ok = await onUnblockUser(selectedContact._id);
    if (ok) {
      setChatStatus({
        blockedByMe: false,
        blockedMe: false,
        canMessage: true,
      });
    }
  };

  return (
    <section className="chat-panel">
      <header className="chat-header">
        {onBack && (
          <button
            type="button"
            className="chat-back-btn"
            onClick={onBack}
            aria-label="Back to contacts"
          >
            ← Back
          </button>
        )}
        <div className="chat-header-text">
          <h2>{selectedContact.name}</h2>
          <p className="chat-subtitle">
            <span
              className={`presence-dot ${selectedContactIsOnline ? "is-online" : "is-offline"}`}
              aria-hidden="true"
            />
            <span>{selectedContactIsOnline ? "Online" : "Offline"}</span>
            <span className="chat-subtitle-sep" aria-hidden="true">
              •
            </span>
            <span className="chat-email">{selectedContact.email}</span>
          </p>
        </div>

        <span className="header-unblock">
          {isBlockedByMe && (
            <button
              type="button"
              className="chat-link-btn"
              onClick={handleUnblock}
              disabled={unblocking || statusLoading}
            >
              {unblocking ? "Unblocking..." : "Unblock"}
            </button>
          )}
        </span>
      </header>

      {!canMessage && (
        <div className="chat-alert inline">
          <p>{blockMessage}</p>
        </div>
      )}

      <article
        className="chat-stream"
        ref={chatStreamRef}
        onScroll={handleScroll}
      >
        {loadingOlder && (
          <p className="chat-meta chat-loading-older">
            Loading older messages...
          </p>
        )}

        {messagesError && (
          <div className="chat-alert">
            <p>{messagesError}</p>
            <button
              type="button"
              onClick={reloadMessages}
              disabled={loadingMessages}
              className="chat-link-btn"
            >
              {loadingMessages ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {loadingMessages && messages.length === 0 && (
          <p className="chat-meta">Loading messages...</p>
        )}

        {messages.map((m) => (
          <div
            key={m._id}
            className={`chat-message-row ${
              getSenderId(m) === selectedContact._id ? "incoming" : "outgoing"
            }`}
          >
            <div className="chat-message-bubble">{m.content}</div>
          </div>
        ))}

        {!loadingMessages && messages.length === 0 && (
          <p className="chat-meta">No messages yet.</p>
        )}
      </article>

      <form className="chat-composer" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping(e.target.value);
          }}
          onBlur={() => stopTyping()}
          className="chat-input"
          disabled={!canMessage || sending}
          placeholder={`Message ${selectedContact.name}`}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim() || !canMessage}
          className="ui-btn ui-btn-primary chat-send-btn"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>

      {sendError && retryMessage && (
        <div className="chat-alert inline">
          <p>{sendError}</p>
          <button
            type="button"
            onClick={() => sendCurrentMessage(retryMessage)}
            disabled={sending}
            className="chat-link-btn"
          >
            {sending ? "Retrying..." : "Retry send"}
          </button>
        </div>
      )}
    </section>
  );
};

export default ChatPanel;
