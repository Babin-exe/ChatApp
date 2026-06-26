import EmojiPicker from "emoji-picker-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../../lib/api.js";

const quickReactions = ["👍", "❤️", "😂", "😮", "😢"];
const PickerMode = {
  QUICK: "quick",
  FULL: "full",
};

const QuickReaction = ({ messageId, isIncoming, onClose }) => {
  const [pickerMode, setPickerMode] = useState(PickerMode.QUICK);

  useEffect(() => {
    if (pickerMode !== PickerMode.FULL) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pickerMode, onClose]);

  const handleReaction = async (emoji) => {
    await api.post(`/api/messages/${messageId}/reactions`, { emoji });
    onClose();
  };

  const fullPicker =
    pickerMode === PickerMode.FULL &&
    createPortal(
      <>
        <button
          type="button"
          className="emoji-picker-backdrop"
          aria-label="Close emoji picker"
          onClick={onClose}
        />
        <div
          className="emoji-picker-sheet"
          role="dialog"
          aria-label="Emoji picker"
        >
          <div className="emoji-picker-sheet-header">
            <span>Add reaction</span>
            <button
              type="button"
              className="emoji-picker-sheet-close"
              aria-label="Close"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <div className="emoji-picker-sheet-body">
            <EmojiPicker
              width="100%"
              height={320}
              onEmojiClick={async (obj) => {
                await handleReaction(obj.emoji);
              }}
            />
          </div>
        </div>
      </>,
      document.body,
    );

  if (pickerMode === PickerMode.FULL) {
    return fullPicker;
  }

  return (
    <div
      className={`quick-reaction${isIncoming ? " incoming" : " outgoing"}`}
      role="toolbar"
      aria-label="Quick reactions"
    >
      {quickReactions.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="quick-reaction-emoji"
          aria-label={`React with ${emoji}`}
          onClick={() => handleReaction(emoji)}
        >
          {emoji}
        </button>
      ))}
      <span className="quick-reaction-divider" aria-hidden="true" />
      <button
        type="button"
        className="quick-reaction-more"
        aria-label="More reactions"
        onClick={() => setPickerMode(PickerMode.FULL)}
      >
        +
      </button>
    </div>
  );
};

export default QuickReaction;
