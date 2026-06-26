import EmojiPicker from "emoji-picker-react";
import QuickReaction from "./QuickReaction.jsx";
import api from "../../../lib/api.js";
import { useState } from "react";

const ChatMessageItem = ({
  m,
  isIncoming,
  isLastOutgoing,
  currentMessageId,
  setCurrentMessageId,
  pickerMode,
  setPickerMode,
  PickerMode,
  showMessageStatus,
  lastOutgoingTimeAgo,
  myUserId,
  editingMessageId,
  setEditingMessageId,
  setEditedText,
  editedText,
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

  const isEditing = editingMessageId === m._id;

  return (
    <div className={`chat-message-row ${isIncoming ? "incoming" : "outgoing"}`}>
      <div className="chat-message-content">
        <div
          className={`chat-message-main ${
            isReactionOpen ? "is-reaction-open" : ""
          }`}
        >
          <div className="chat-message-bubble">
            {isEditing ? (
              <>
                <div>
                  <input
                    type="text"
                    value={editedText}
                    onChange={(e) => {
                      setEditedText(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <button
                    disabled={
                      editedText.trim() === "" ||
                      editedText.trim() === m.content
                    }
                    className="send_edited"
                    onClick={() => {
                      //I will do something here
                    }}
                  >
                    Send
                  </button>
                  <button
                    className="cancle_edited"
                    onClick={() => {
                      setEditedText("");
                      setEditingMessageId(null);
                    }}
                  >
                    Cancle
                  </button>
                </div>
              </>
            ) : m.type === "image" ? (
              <>
                <img
                  src={m.image?.url}
                  alt="sent attachment"
                  className="chat-image-message"
                />

                {m.content && <p>{m.content}</p>}
              </>
            ) : (
              m.content
            )}
          </div>

          <div className="chat-message-reaction">
            <button
              type="button"
              aria-label="Add reaction"
              onClick={() => {
                setCurrentMessageId((prev) => (m._id === prev ? null : m._id));
                setPickerMode(PickerMode.QUICK);
              }}
            >
              <img src="/emoji_icon.png" height={20} width={20} alt="" />
            </button>

            <div className="edit-button">
              <button
                onClick={() => {
                  setEditingMessageId(m._id);
                  setEditedText(m.content);
                }}
              >
                hehe
              </button>
            </div>

            {isReactionOpen &&
              (pickerMode === PickerMode.QUICK ? (
                <QuickReaction
                  messageId={currentMessageId}
                  onClose={() => setCurrentMessageId(null)}
                />
              ) : (
                <div className="emoji-picker">
                  <EmojiPicker
                    onClick={() => {
                      setCurrentMessageId(null);
                    }}
                    onEmojiClick={async (obj) => {
                      await api.post(
                        `/api/messages/${currentMessageId}/reactions`,
                        {
                          emoji: obj.emoji,
                        }
                      );
                    }}
                  />
                </div>
              ))}
          </div>
        </div>

        <div className="message-reactions">
          <div className="message-reactions">
            {reactionGroups.map((group) => (
              <button
                type="button"
                className={`reaction-pill ${
                  group.users.some((user) => user.isMine) ? "mine" : ""
                }`}
                key={group.emoji}
                title={group.users
                  .map((user) => `${user.name} reacted ${group.emoji}`)
                  .join("\n")}
              >
                <span>{group.emoji}</span>
                {group.users.length > 1 && <span>{group.users.length}</span>}
              </button>
            ))}
          </div>
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
