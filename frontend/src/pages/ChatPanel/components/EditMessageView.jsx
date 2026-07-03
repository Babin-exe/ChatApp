const EditMessageView = ({
  editedText,
  setEditedText,
  originalMessage,
  onSend,
  onCancel,
}) => {
  const isUnchanged = editedText.trim() === originalMessage;
  const isEmpty = editedText.trim() === "";

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isUnchanged && !isEmpty) {
        onSend();
      }
    }

    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="chat-message-edit">
      <div className="chat-message-input">
        <input
          type="text"
          className="chat-message-input-field"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Edit your message..."
        />
      </div>

      <div className="chat-message-edit-actions">
        <button type="button" className="cancle_edited" onClick={onCancel}>
          Cancel
        </button>

        <button
          type="button"
          className="send_edited"
          disabled={isUnchanged || isEmpty}
          onClick={onSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default EditMessageView;
