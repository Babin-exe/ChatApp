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
      <textarea
        className="chat-message-edit-field"
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        rows={1}
        placeholder="Edit your message..."
      />

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
          Save
        </button>
      </div>
    </div>
  );
};

export default EditMessageView;
