import EmojiPicker from "emoji-picker-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../../lib/api.js";

const quickReactions = ["👍", "❤️", "😂", "😮", "😢"];
const PickerMode = {
  QUICK: "quick",
  FULL: "full",
};

const VIEWPORT_PADDING = 12;
const BAR_GAP = 8;

const QuickReaction = ({ messageId, isIncoming, anchorRef, onClose }) => {
  const [pickerMode, setPickerMode] = useState(PickerMode.QUICK);
  const [barStyle, setBarStyle] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useLayoutEffect(() => {
    if (pickerMode !== PickerMode.QUICK || !anchorRef?.current) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      const barEl = barRef.current;
      const barWidth = barEl?.offsetWidth ?? 268;
      const barHeight = barEl?.offsetHeight ?? 44;

      let placement = "above";
      let top = anchorRect.top - barHeight - BAR_GAP;

      if (top < VIEWPORT_PADDING) {
        placement = "below";
        top = anchorRect.bottom + BAR_GAP;
      }

      let left = isIncoming ? anchorRect.left : anchorRect.right - barWidth;

      left = Math.max(
        VIEWPORT_PADDING,
        Math.min(left, window.innerWidth - barWidth - VIEWPORT_PADDING)
      );

      top = Math.max(
        VIEWPORT_PADDING,
        Math.min(top, window.innerHeight - barHeight - VIEWPORT_PADDING)
      );

      setBarStyle({
        top: `${top}px`,
        left: `${left}px`,
        placement,
      });
    };

    updatePosition();

    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, isIncoming, pickerMode]);

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
      document.body
    );

  if (pickerMode === PickerMode.FULL) {
    return fullPicker;
  }

  const quickBar = createPortal(
    <>
      <button
        type="button"
        className="quick-reaction-backdrop"
        aria-label="Close reactions"
        onClick={onClose}
      />
      <div
        ref={barRef}
        className={`quick-reaction quick-reaction--${barStyle?.placement ?? "above"}${isIncoming ? " incoming" : " outgoing"}`}
        style={
          barStyle
            ? { top: barStyle.top, left: barStyle.left }
            : { visibility: "hidden", top: 0, left: 0 }
        }
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
    </>,
    document.body
  );

  return quickBar;
};

export default QuickReaction;
