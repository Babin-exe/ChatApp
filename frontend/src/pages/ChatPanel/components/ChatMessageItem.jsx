import { useRef } from "react";
import QuickReaction from "./QuickReaction.jsx";
import EditMessageView from "./EditMessageView.jsx";
import api from "../../../lib/api.js";
import toast from "react-hot-toast";

const truncateText = (text, maxLength = 40) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

const ChatMessageItem = ({
  m,
  isIncoming,
  isLastOutgoing,
  currentMessageId,
  setCurrentMessageId,
  setPickerMode,
  PickerMode,
  showMessageStatus,
  lastOutgoingTimeAgo,
  myUserId,
  editingMessageId,
  setEditingMessageId,
  setEditedText,
  editedText,
  setReplyToMessageId,
  setReplyToMessage,
  inputRef,
  messageRefs,
  //////
  imageSelected,
  setImageSelected
  //////
}) => {
  const isReactionOpen = m._id === currentMessageId;
  const bubbleWrapRef = useRef(null);

  const reactionGroups = Object.values(
    (m.reactions ?? []).reduce((groups, reaction) => {
      const user = reaction.user;
      const userId = typeof user === "string" ? user : user?._id;
      const isMine = userId === myUserId;

      groups[reaction.emoji] ??= {
        emoji: reaction.emoji,
        users: [],
      };

      groups[reaction.emoji].users.push({
        id: userId,
        name: isMine ? "You" : (user?.name ?? "Someone"),
        profilePic: user?.profilePic,
        isMine,
      });

      return groups;
    }, {}),
  );

  const highlightBubble = (bubble) => {
    bubble.classList.remove("highlight");
    void bubble.offsetWidth;
    bubble.classList.add("highlight");

    bubble.addEventListener(
      "animationend",
      () => bubble.classList.remove("highlight"),
      { once: true },
    );
  };

  const jumpToReply = () => {
    const bubble = messageRefs.current[m.replyToMessageId._id];

    if (!bubble) return;

    bubble.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        highlightBubble(bubble);
      });
    });
  };

  const handleSendEditedMessage = async () => {
    try {
      await api.patch(`/api/messages/edit/${m._id}`, {
        content: editedText,
      });

      setEditedText("");
      setEditingMessageId(null);

      toast.success("Message edited successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  };

  const handleReply = () => {
    setReplyToMessageId(m._id);
    setReplyToMessage(m.content);
    inputRef.current?.focus();
    setEditingMessageId(null);
    setEditedText(null);
  };

  const isEditing = editingMessageId === m._id;

  const senderId =
    typeof m.senderId === "object" ? m.senderId?._id : m.senderId;

  const replySenderName =
    typeof m.replyToMessageId?.senderId === "object"
      ? m.replyToMessageId.senderId?.name
      : null;

  const replyPreviewText = m.replyToMessageId?.content
    ? truncateText(m.replyToMessageId.content)
    : m.replyToMessageId?.type === "image"
      ? "Photo"
      : "";

  return (
    <div className={`chat-message-row ${isIncoming ? "incoming" : "outgoing"}`}>
      <div className="chat-message-content">
        <div
          className={`chat-message-main ${isReactionOpen ? "is-reaction-open" : ""
            }`}
        >
          {isReactionOpen && (
            <QuickReaction
              messageId={currentMessageId}
              isIncoming={isIncoming}
              anchorRef={bubbleWrapRef}
              onClose={() => setCurrentMessageId(null)}
            />
          )}

          <div
            ref={bubbleWrapRef}
            className={`chat-message-bubble-wrap${reactionGroups.length > 0 ? " has-reactions" : ""
              }${isReactionOpen ? " is-picker-open" : ""}`}
          >
            <div
              className="chat-message-bubble"
              ref={(element) => {
                if (element) {
                  messageRefs.current[m._id] = element;
                } else {
                  delete messageRefs.current[m._id];
                }
              }}
            >
              {m.replyToMessageId && (
                <button
                  type="button"
                  className="reply_to"
                  onClick={jumpToReply}
                  aria-label="Jump to replied message"
                >
                  <span className="reply_to-label">
                    {replySenderName ?? "Original message"}
                  </span>
                  <span className="reply_to-text">{replyPreviewText}</span>
                </button>
              )}

              <div className="bubble-content">
                <div
                  className="original-message-content"
                  style={{
                    opacity: isEditing ? 0.3 : 1,
                    filter: isEditing ? "blur(1px)" : "none",
                    transition: "all 0.2s ease",
                    pointerEvents: isEditing ? "none" : "auto"
                  }}
                >
                  {m.type === "image" && (
                    <img
                      onClick={() => {
                        console.log("Clicked on the image i guess");
                        setImageSelected(m.image?.url);
                      }}
                      src={m.image?.url}
                      alt="sent attachment"
                      className={`chat-image-message ${m.content ? "has-text" : "no-text"}`}
                    />
                  )}

                  {m.content && <p>{m.content}</p>}
                </div>

                {isEditing && (
                  <EditMessageView
                    editedText={editedText}
                    setEditedText={setEditedText}
                    originalMessage={m.content}
                    onSend={handleSendEditedMessage}
                    onCancel={() => {
                      setEditedText("");
                      setEditingMessageId(null);
                      inputRef.current?.blur();
                    }}
                  />
                )}
              </div>
            </div>

            {reactionGroups.length > 0 && (
              <div className="message-reactions">
                {reactionGroups.map((group) => (
                  <button
                    key={group.emoji}
                    type="button"
                    className={`reaction-pill ${group.users.some((user) => user.isMine) ? "mine" : ""
                      }`}
                    title={group.users
                      .map((user) => `${user.name} reacted ${group.emoji}`)
                      .join("\n")}
                  >
                    <span>{group.emoji}</span>

                    {group.users.length > 1 && (
                      <span>{group.users.length}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="chat-message-reaction" aria-label="Message actions">
              <button
                type="button"
                aria-label="Add reaction"
                onClick={() => {
                  setCurrentMessageId((prev) =>
                    prev === m._id ? null : m._id,
                  );
                  setPickerMode(PickerMode.QUICK);
                  setReplyToMessageId(null);
                  setReplyToMessage(null);
                  setEditingMessageId(null);
                  setEditedText(null);
                }}
              >
                <img
                  src="/emoji_icon.png"
                  width={18}
                  height={18}
                  alt=""
                  aria-hidden="true"
                />
              </button>

              {myUserId === senderId?.toString() && (
                <button
                  type="button"
                  aria-label="Edit message"
                  className="chat-action-edit"
                  onClick={() => {
                    setEditingMessageId(m._id);
                    setEditedText(m.content);
                    setReplyToMessageId(null);
                    setReplyToMessage(null);
                  }}
                >
                  ✎
                </button>
              )}

              <button
                type="button"
                aria-label="Reply to message"
                className="chat-action-reply"
                onClick={handleReply}
              >
                ↩
              </button>
            </div>
          )}
        </div>

        <div className="message-status-time-info">
          {isLastOutgoing && showMessageStatus && (
            <span className="latest-status">{m.status}</span>
          )}

          {isLastOutgoing && (
            <span className="latest-sent">{lastOutgoingTimeAgo}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;
