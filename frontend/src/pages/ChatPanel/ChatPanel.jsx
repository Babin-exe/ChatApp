import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import "./ChatPanel.css";
import api from "../../lib/api.js";
import { useRef } from "react";
import { UseSocketContext } from "../../context/socketContext.js";

const ChatPanel = ({
  selectedContact,
  onUnblockUser,
  actionLoadingId,
  blockedUsers = [],
  onBack,
}) => {
  const { authUser, lastMessage } = UseSocketContext();

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

  const [chatStatus, setChatStatus] = useState({
    blockedByMe: false,
    blockedMe: false,
    canMessage: true,
  });

  const [statusLoading, setStatusLoading] = useState(false);
  const chatStreamRef = useRef(null);
  const isInitialLoadDone = useRef(false);
  const myUserId = normalizeId(authUser);

  const getSenderId = (message) => {
    if (!message?.senderId) return "";
    return typeof message.senderId === "string"
      ? message.senderId
      : message.senderId._id;
  };

  const fetchMessages = useCallback(async () => {
    if (!selectedContact) return;

    try {
      setLoadingMessages(true);
      setMessagesError("");

      const res = await api.get(`/api/chats/messages/${selectedContact._id}`);

      setMessages(res.data.data || []);
      setNextCursor(res.data.nextCursor || null);

      setTimeout(() => {
        const el = chatStreamRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
        isInitialLoadDone.current = true;
      }, 50);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to load messages. Please retry.";
      setMessagesError(message);
      toast.error(message);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedContact]);

  const fetchOlderMessages = useCallback(async () => {
    if (!nextCursor || loadingOlder || !selectedContact) return;

    try {
      setLoadingOlder(true);
      const el = chatStreamRef.current;
      const prevScrollHeight = el ? el.scrollHeight : 0;
      const res = await api.get(
        `/api/chats/messages/${selectedContact._id}?cursor=${nextCursor}`,
      );
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
        if (el) {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight;
        }
      }, 30);
    } catch {
      toast.error("Failed to load older messages. Please retry.");
    } finally {
      setLoadingOlder(false);
    }
  }, [nextCursor, loadingOlder, selectedContact]);

  const handleScroll = useCallback(() => {
    const el = chatStreamRef.current;

    if (!el || !isInitialLoadDone.current) return;

    if (el.scrollTop < 50 && nextCursor && !loadingOlder) {
      fetchOlderMessages();
    }
  }, [nextCursor, loadingOlder, fetchOlderMessages]);

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
    if (!selectedContact) {
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

    setChatStatus(defaultStatusFromBlockedList);
    isInitialLoadDone.current = false;
    fetchMessages();
  }, [defaultStatusFromBlockedList, fetchMessages, selectedContact]);

  useEffect(() => {
    if (!selectedContact?._id) return;

    const controller = new AbortController();

    const fetchChatStatus = async () => {
      try {
        setStatusLoading(true);

        const res = await api.get(`/api/chats/status/${selectedContact._id}`, {
          signal: controller.signal,
        });

        const status = res.data?.status;
        if (!status) return;

        setChatStatus({
          blockedByMe: Boolean(status.blockedByMe),
          blockedMe: Boolean(status.blockedMe),
          canMessage: Boolean(status.canMessage),
        });
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }

        setChatStatus(defaultStatusFromBlockedList);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchChatStatus();

    return () => {
      controller.abort();
    };
  }, [selectedContact?._id, defaultStatusFromBlockedList]);

  useEffect(() => {
    if (!selectedContact || !lastMessage || !myUserId) return;

    const senderId = normalizeId(lastMessage.senderId);
    const receiverId = normalizeId(lastMessage.receiverId);

    const belongsToOpenChat =
      (senderId === myUserId && receiverId === selectedContact._id) ||
      (senderId === selectedContact._id && receiverId === myUserId);

    if (!belongsToOpenChat) return;

    setMessages((prev) => {
      if (prev.some((m) => m._id === lastMessage._id)) return prev;
      return [...prev, lastMessage];
    });

    setTimeout(() => {
      const el = chatStreamRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 30);
  }, [lastMessage, selectedContact, myUserId]);

  const sendCurrentMessage = async (contentToSend) => {
    if (!selectedContact || !contentToSend.trim()) return;
    if (!chatStatus.canMessage) {
      toast.error("You can't message this user");
      return;
    }

    try {
      setSending(true);
      setSendError("");

      const res = await api.post(`/api/messages/send/${selectedContact._id}`, {
        content: contentToSend,
        type: "text",
      });

      const savedMessage = res.data.messageData;
      if (!savedMessage?._id) {
        throw new Error("Invalid send response");
      }

      setMessages((prev) => {
        if (prev.some((message) => message._id === savedMessage._id))
          return prev;
        return [...prev, savedMessage];
      });

      setTimeout(() => {
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
          <p>{selectedContact.email}</p>
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
              onClick={fetchMessages}
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
          onChange={(e) => setNewMessage(e.target.value)}
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
