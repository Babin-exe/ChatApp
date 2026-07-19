import { useState } from "react";

const EditMessageView = ({
  editedText,
  setEditedText,
  originalMessage,
  onSend,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUnchanged = editedText.trim() === originalMessage;
  const isEmpty = editedText.trim() === "";

  const handleSend = async () => {
    if (isSubmitting || isUnchanged || isEmpty) return;
    setIsSubmitting(true);
    try {
      await onSend();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    if (e.key === "Escape" && !isSubmitting) {
      onCancel();
    }
  };

  return (
    <div className="chat-message-edit">
      <textarea
        className="chat-message-edit-field"
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        disabled={isSubmitting}
        rows={1}
        placeholder="Edit your message..."
      />

      <div className="chat-message-edit-actions">
        <span className="chat-message-edit-hint">
          escape to cancel • enter to save
        </span>
        <div className="chat-message-edit-buttons">
          <button 
            type="button" 
            className="cancle_edited" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="send_edited"
            disabled={isUnchanged || isEmpty || isSubmitting}
            onClick={handleSend}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMessageView;
