import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import "./ChatPanel.css";
import api from "../../lib/api.js";
import axios from "axios";
import { UseSocketContext } from "../../context/socketContext.js";
import ChatComposer from "./components/ChatComposer.jsx";
import ChatHeader from "./components/ChatHeader.jsx";
import ChatStream from "./components/ChatStream.jsx";

const isRequestCanceled = (err) =>
  axios.isCancel(err) ||
  err?.code === "ERR_CANCELED" ||
  err?.name === "CanceledError" ||
  err?.name === "AbortError";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
]);

const PickerMode = {
  QUICK: "quick",
  FULL: "full",
};

function validateImageFile(file) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Use PNG , JPEG , JPG , GIF  or Webp";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Image size too large";
  }

  return null;
}

function formatTimeAgo(dateInput) {
  if (!dateInput) return;

  const info = new Date(dateInput).getTime();
  const now = Date.now();
  const diff = now - info;

  const units = [
    { label: "y", ms: 365 * 24 * 60 * 60 * 1000 },
    { label: "mo", ms: 30 * 24 * 60 * 60 * 1000 },
    { label: "d", ms: 24 * 60 * 60 * 1000 },
    { label: "h", ms: 60 * 60 * 1000 },
    { label: "m", ms: 60 * 1000 },
    { label: "s", ms: 1000 },
  ];

  for (const unit of units) {
    const value = Math.floor(diff / unit.ms);
    if (value > 0) return `${value}${unit.label} ago`;
  }
  return "just now";
}

const ChatPanel = ({
  selectedContact,
  onUnblockUser,
  actionLoadingId,
  blockedUsers = [],
  onBack,
}) => {
  const {
    authUser,
    lastMessage,
    onlineUsers,
    socket,
    typingUsers,
    lastMessageStatus,
    openConversation,
    lastReactionUpdate,
    editedMessage,
  } = UseSocketContext();

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
  const [hasFailedMessage, setHasFailedMessage] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const isTypingRef = useRef(false);
  const typingIdleTimeoutRef = useRef(null);
  const TYPING_IDLE_MS = 1500;
  const fileInputRef = useRef(null);
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
    selectedContactId && onlineUsers?.has(String(selectedContactId))
  );
  const lastTypedUserRef = useRef(null);

  const typingAudioRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [_tick, setNowTick] = useState(0);

  const [currentMessageId, setCurrentMessageId] = useState("");

  const [pickerMode, setPickerMode] = useState(PickerMode.QUICK);

  const [editingMessageId, setEditingMessageId] = useState(null);

  const [editedText, setEditedText] = useState("");

  const [replyToMessageId, setReplyToMessageId] = useState(null);

  const [replyToMessage, setReplyToMessage] = useState(null);

  const inputRef = useRef(null);

  const messageRefs = useRef({});

  const [imageSelected, setImageSelected] = useState(null);


  useEffect(() => {
    if (!typingAudioRef.current) {
      const audio = new Audio("/typing.wav");
      audio.loop = true;
      audio.volume = 0.25;
      typingAudioRef.current = audio;
    }

    const audio = typingAudioRef.current;

    const isSelectedUserTyping = typingUsers?.has(String(selectedContactId));

    if (isSelectedUserTyping) {
      if (audio.paused) {
        audio.play().catch((error) => {
          console.log("Audio Error :", error);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }

    return () => {
      if (typingAudioRef.current) {
        typingAudioRef.current.pause();
        typingAudioRef.current.currentTime = 0;
      }
    };
  }, [selectedContactId, typingUsers]);

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
        `/api/chats/messages/${contactId}?cursor=${nextCursor}`
      );

      if (activeMessagesContactIdRef.current !== contactId) return;

      const olderMessages = res.data.data || [];
      setNextCursor(res.data.nextCursor || null);
      setMessages((prev) => {
        const seen = new Set(prev.map((message) => message._id));
        const uniqueOlder = olderMessages.filter(
          (message) => !seen.has(message._id)
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
    [socket]
  );

  const clearTypingTimer = useCallback(() => {
    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
      typingIdleTimeoutRef.current = null;
    }
  }, []);

  const showMessageStatus = useMemo(() => {
    if (!messages?.length) return false;

    const last = messages[messages.length - 1];
    const lastId = normalizeId(last.senderId);
    return lastId == myUserId;
  }, [messages, myUserId]);

  const stopTyping = useCallback(() => {
    const targetUserId = lastTypedUserRef.current;

    if (!targetUserId) return;
    if (!isTypingRef.current) return;

    safeSend({ type: "typing:stop", data: { toUserId: targetUserId } });

    isTypingRef.current = false;
    lastTypedUserRef.current = null;

    clearTypingTimer();
  }, [safeSend, clearTypingTimer]);

  const handleTyping = useCallback(
    (value) => {
      if (!selectedContactId) return;

      clearTypingTimer();

      const isEmpty = value.trim() === "";
      if (isEmpty) {
        typingIdleTimeoutRef.current = setTimeout(() => {
          stopTyping();
        }, TYPING_IDLE_MS);
        return;
      }

      if (
        lastTypedUserRef.current &&
        lastTypedUserRef.current !== selectedContactId
      ) {
        stopTyping();
      }

      if (!isTypingRef.current) {
        safeSend({
          type: "typing:start",
          data: { toUserId: selectedContactId },
        });
        isTypingRef.current = true;
        lastTypedUserRef.current = selectedContactId;
      }

      typingIdleTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, TYPING_IDLE_MS);
    },
    [stopTyping, selectedContactId, safeSend, clearTypingTimer]
  );

  const defaultStatusFromBlockedList = useMemo(() => {
    const isBlockedByMe = blockedUsers.some(
      (entry) => entry?.blocked?._id === selectedContact?._id
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
      // setRetryPayload(null);
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
    // setRetryPayload(null);
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
    openConversation(selectedContactId);
  }, [selectedContactId, openConversation]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  useEffect(() => {
    if (!lastMessageStatus?.messageId) return;

    setMessages((prev) =>
      prev.map((message) => {
        if (message._id !== lastMessageStatus.messageId) return message;

        return {
          ...message,
          status: lastMessageStatus.status,
          deliveredAt: lastMessageStatus.deliveredAt ?? message.deliveredAt,
          seenAt: lastMessageStatus.seenAt ?? message.seenAt,
        };
      })
    );
  }, [lastMessageStatus]);

  useEffect(() => {
    const id = setInterval(() => setNowTick((e) => e + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!lastReactionUpdate) return;

    setMessages((prev) => {
      return prev.map((message) => {
        return message._id === lastReactionUpdate.messageId
          ? { ...message, reactions: lastReactionUpdate.reactions }
          : message;
      });
    });
  }, [lastReactionUpdate]);

  useEffect(() => {
    setMessages((prev) => {
      console.log(prev);
      return prev.map((message) =>
        message._id === editedMessage.messageId
          ? { ...message, content: editedMessage.content }
          : message
      );
    });
  }, [editedMessage]);

  const lastOutgoingIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (normalizeId(messages[i].senderId) === myUserId) {
        return i;
      }
    }
    return -1;
  }, [messages, myUserId]);

  const lastOutgoingTimeAgo = useMemo(() => {
    if (!messages.length || !myUserId) return null;

    const latest = messages[messages.length - 1];
    const senderId = normalizeId(latest.senderId);

    if (myUserId !== senderId) return null;

    return formatTimeAgo(latest.createdAt);
  }, [messages, myUserId]);

  const handleRetrySend = async () => {
    const content = newMessage.trim();
    if (!content && !selectedImage) return;

    const sent = await sendCurrentMessage(content, selectedImage);

    if (!sent) return;

    setNewMessage("");
    clearSelectedImage();
  };

  const clearSelectedImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      toast.error(err);
      e.target.value = "";
      return;
    }
    setSelectedImage(file);
  };

  const sendCurrentMessage = async (contentToSend, imageToSend) => {
    if (!selectedContact || (!contentToSend.trim() && !imageToSend)) return;

    if (!chatStatus.canMessage) {
      toast.error("You can't message this user");
      return;
    }

    if (imageToSend) {
      const error = validateImageFile(imageToSend);
      if (error) {
        toast(error);
        return false;
      }
    }

    const contactId = selectedContact._id;

    try {
      setSending(true);
      setSendError("");

      const formData = new FormData();

      formData.append("content", contentToSend || "");

      if (imageToSend) {
        formData.append("image", imageToSend);
      }

      if (replyToMessageId) {
        formData.append("replyToMessageId", replyToMessageId);
      }

      /*{
          url,
          data,
          {configs }
         }*/

      const res = await api.post(`/api/messages/send/${contactId}`, formData, {
        timeout: imageToSend ? 60000 : 20000,
      });

      const savedMessage = res.data.messageData;

      if (!savedMessage?._id) {
        throw new Error("Invalid send response");
      }

      if (activeMessagesContactIdRef.current !== contactId) return;

      console.log(savedMessage);

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

      setHasFailedMessage(false);

      return res;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to send message. Please retry.";

      setSendError(message);
      // setRetryPayload({ content: contentToSend, image: imageToSend });
      setHasFailedMessage(true);
      toast.error(message);

      return false;
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const content = newMessage.trim();
    if (!content && !selectedImage) return;

    stopTyping();

    const sent = await sendCurrentMessage(content, selectedImage);

    console.log(sent);

    setReplyToMessageId(null);
    setReplyToMessage(null);

    if (!sent) return;

    setNewMessage("");

    clearSelectedImage();
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
      <ChatHeader
        onBack={onBack}
        selectedContact={selectedContact}
        selectedContactId={selectedContactId}
        typingUsers={typingUsers}
        selectedContactIsOnline={selectedContactIsOnline}
        isBlockedByMe={isBlockedByMe}
        handleUnblock={handleUnblock}
        unblocking={unblocking}
        statusLoading={statusLoading}
      />

      {!canMessage && (
        <div className="chat-alert inline">
          <p>{blockMessage}</p>
        </div>
      )}

      <ChatStream
        myUserId={myUserId}
        chatStreamRef={chatStreamRef}
        handleScroll={handleScroll}
        loadingOlder={loadingOlder}
        messagesError={messagesError}
        reloadMessages={reloadMessages}
        loadingMessages={loadingMessages}
        messages={messages}
        lastOutgoingIndex={lastOutgoingIndex}
        getSenderId={getSenderId}
        selectedContact={selectedContact}
        currentMessageId={currentMessageId}
        setCurrentMessageId={setCurrentMessageId}
        pickerMode={pickerMode}
        setPickerMode={setPickerMode}
        PickerMode={PickerMode}
        showMessageStatus={showMessageStatus}
        lastOutgoingTimeAgo={lastOutgoingTimeAgo}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
        editedText={editedText}
        setEditedText={setEditedText}
        setReplyToMessageId={setReplyToMessageId}
        setReplyToMessage={setReplyToMessage}
        inputRef={inputRef}
        messageRefs={messageRefs}
        imageSelected={imageSelected}
        setImageSelected={setImageSelected}
      />

      <ChatComposer
        handleSendMessage={handleSendMessage}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleTyping={handleTyping}
        stopTyping={stopTyping}
        canMessage={canMessage}
        sending={sending}
        selectedContact={selectedContact}
        fileInputRef={fileInputRef}
        handleImageChange={handleImageChange}
        selectedImage={selectedImage}
        imagePreviewUrl={imagePreviewUrl}
        clearSelectedImage={clearSelectedImage}
        inputRef={inputRef}
        replyToMessage={replyToMessage}
        setReplyToMessageId={setReplyToMessageId}
        setReplyToMessage={setReplyToMessage}
        replyToMessageId={replyToMessageId}
      />

      {sendError && hasFailedMessage && (
        <div className="chat-alert inline">
          <p>{sendError}</p>
          <button
            type="button"
            onClick={handleRetrySend}
            disabled={sending}
            className="chat-link-btn"
          >
            {sending ? "Retrying..." : "Retry send"}
          </button>
        </div>
      )}

      {imageSelected && (
        <div className="fullscreen-image-overlay" onClick={() => setImageSelected(null)}>
          <button
            type="button"
            className="fullscreen-image-close"
            onClick={() => setImageSelected(null)}
            aria-label="Close fullscreen image"
          >
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <img
            src={imageSelected}
            alt="Fullscreen attachment"
            className="fullscreen-image-content"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default ChatPanel;
