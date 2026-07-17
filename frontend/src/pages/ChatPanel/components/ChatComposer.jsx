const truncateText = (text, maxLength = 40) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

const ChatComposer = ({
  handleSendMessage,
  newMessage,
  setNewMessage,
  handleTyping,
  stopTyping,
  canMessage,
  sending,
  selectedContact,
  fileInputRef,
  handleImageChange,
  selectedImage,
  imagePreviewUrl,
  clearSelectedImage,
  inputRef,
  replyToMessage,
  replyToMessageId,
  setReplyToMessageId,
  setReplyToMessage,
}) => {
  const clearReply = () => {
    setReplyToMessageId(null);
    setReplyToMessage(null);
  };

  return (
    <>
      {replyToMessageId && (
        <div className="reply_popup">
          <div className="reply_popup-content">
            <span className="reply_popup-label">Replying to</span>
            <span className="reply_popup-text">
              {replyToMessage ? truncateText(replyToMessage) : "Message"}
            </span>
          </div>

          <button
            type="button"
            className="reply_popup-close"
            onClick={clearReply}
            aria-label="Cancel reply"
          >
            <img src="/close.png" height={16} width={16} alt="" aria-hidden="true" />
          </button>
        </div>
      )}

      <form className="chat-composer" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          ref={inputRef}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping(e.target.value);
          }}
          onBlur={() => stopTyping()}
          className="chat-input"
          disabled={!canMessage || sending}
          placeholder={`Message ${selectedContact.name}`}
        />

        <div className="chat-attachment-outer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={!canMessage || sending}
            className="chat-input-file"
            onChange={handleImageChange}
          />

          {selectedImage ? (
            <div className="chat-attachment-preview">
              {imagePreviewUrl && (
                <img src={imagePreviewUrl} alt="Selected attachment Preview " />
              )}

              <button
                type="button"
                className="chat-attachment-remove"
                onClick={clearSelectedImage}
                disabled={sending}
                aria-label="Remove selected image"
              >
                X
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="chat-attachment-picker"
              disabled={!canMessage || sending}
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <img src="/upload_image.png" alt="plus" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={
            sending || (!newMessage.trim() && !selectedImage) || !canMessage
          }
          className="ui-btn ui-btn-primary chat-send-btn"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </>
  );
};

export default ChatComposer;
