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
  return (
    <div className={`chat-message-row ${isIncoming ? "incoming" : "outgoing"}`}>
      <div className="chat-message-content">
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
          )}{" "}
        </div>

        <div className="chat-message-reaction">
          <button
            onClick={() => {
              setCurrentMessageId((prev) => (m._id === prev ? null : m._id));
              console.log(m._id);
              setPickerMode(PickerMode.QUICK);
            }}
          >
            <img src="/emoji_icon.png" height={20} width={20} alt="" />
          </button>

          {m._id === currentMessageId &&
            (pickerMode === PickerMode.QUICK ? (
              <QuickReaction messageId={currentMessageId} />
            ) : (
              <EmojiPicker
                onEmojiClick={async (obj) => {
                  console.log(obj.emoji);
                  await api.post(
                    `/api/messages/${currentMessageId}/reactions`,
                    {
                      emoji: obj.emoji,
                    }
                  );
                }}
              />
            ))}
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
