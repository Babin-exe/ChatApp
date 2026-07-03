import QuickReaction from "./QuickReaction.jsx";
import EditMessageView from "./EditMessageView.jsx";
import api from "../../../lib/api.js";
import toast from "react-hot-toast";

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
}) => {
  const isReactionOpen = m._id === currentMessageId;

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
        name: isMine ? "You" : user?.name ?? "Someone",
        profilePic: user?.profilePic,
        isMine,
      });

      return groups;
    }, {})
  );

  const highlightBubble = (bubble) => {
    bubble.classList.remove("highlight");
    void bubble.offsetWidth;
    bubble.classList.add("highlight");

    bubble.addEventListener(
      "animationend",
      () => bubble.classList.remove("highlight"),
      { once: true }
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
  };

  const isEditing = editingMessageId === m._id;

  const senderId =
    typeof m.senderId === "object" ? m.senderId?._id : m.senderId;

  return (
    <div className={`chat-message-row ${isIncoming ? "incoming" : "outgoing"}`}>
      <div className="chat-message-content">
        <div
          className={`chat-message-main ${
            isReactionOpen ? "is-reaction-open" : ""
          }`}
        >
          {isReactionOpen && (
            <QuickReaction
              messageId={currentMessageId}
              isIncoming={isIncoming}
              onClose={() => setCurrentMessageId(null)}
            />
          )}

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
              <div className="reply_to" onClick={jumpToReply}>
                <strong>Replying to : </strong>

                <span>
                  {m.replyToMessageId.content.length > 40
                    ? `${m.replyToMessageId.content.slice(0, 40)}...`
                    : m.replyToMessageId.content}
                </span>
              </div>
            )}

            <div className="bubble-content">
              {isEditing ? (
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
              ) : (
                <>
                  {m.type === "image" && (
                    <img
                      src={m.image?.url}
                      alt="sent attachment"
                      className="chat-image-message"
                    />
                  )}

                  {m.content && <p>{m.content}</p>}
                </>
              )}
            </div>
          </div>

          <div className="chat-message-reaction">
            <button
              type="button"
              aria-label="Add reaction"
              onClick={() => {
                setCurrentMessageId((prev) => (prev === m._id ? null : m._id));

                setPickerMode(PickerMode.QUICK);
              }}
            >
              <img
                src="/emoji_icon.png"
                width={20}
                height={20}
                alt="Reaction"
              />
            </button>

            {myUserId === senderId?.toString() && (
              <button
                onClick={() => {
                  setEditingMessageId(m._id);
                  setEditedText(m.content);
                }}
              >
                Edit
              </button>
            )}

            <button onClick={handleReply}>Reply</button>
          </div>
        </div>

        {reactionGroups.length > 0 && (
          <div className="message-reactions">
            {reactionGroups.map((group) => (
              <button
                key={group.emoji}
                className={`reaction-pill ${
                  group.users.some((user) => user.isMine) ? "mine" : ""
                }`}
                title={group.users
                  .map((user) => `${user.name} reacted ${group.emoji}`)
                  .join("\n")}
              >
                <span>{group.emoji}</span>

                {group.users.length > 1 && <span>{group.users.length}</span>}
              </button>
            ))}
          </div>
        )}

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
