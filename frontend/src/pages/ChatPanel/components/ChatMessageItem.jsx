import EmojiPicker from "emoji-picker-react";
import QuickReaction from "./QuickReaction.jsx";
import api from "../../../lib/api.js";

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
}) => {
  const isReactionOpen = m._id === currentMessageId;

  return (
    <div className={`chat-message-row ${isIncoming ? "incoming" : "outgoing"}`}>
      <div className="chat-message-content">
        <div
          className={`chat-message-main ${
            isReactionOpen ? "is-reaction-open" : ""
          }`}
        >
          <div className="chat-message-bubble">
            {m.type === "image" ? (
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
                console.log(m._id);
                setPickerMode(PickerMode.QUICK);
              }}
            >
              <img src="/emoji_icon.png" height={20} width={20} alt="" />
            </button>

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
          {m?.reactions?.map((m) => {
            //I dont know man
            return <span key={m.emoji}>{m.emoji}</span>;
          })}
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
