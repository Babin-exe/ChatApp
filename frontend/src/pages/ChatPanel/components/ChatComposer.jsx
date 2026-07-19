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
        <div className="composer-inner">
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
                  <img src={imagePreviewUrl} alt="Selected attachment Preview" />
                )}

                <button
                  type="button"
                  className="chat-attachment-remove"
                  onClick={clearSelectedImage}
                  disabled={sending}
                  aria-label="Remove selected image"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="chat-attachment-picker"
                disabled={!canMessage || sending}
                onClick={() => fileInputRef.current?.click()}
                title="Attach an image"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            )}
          </div>

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
            placeholder={`Message ${selectedContact.name}...`}
          />

          <button
            type="submit"
            disabled={
              sending || (!newMessage.trim() && !selectedImage) || !canMessage
            }
            className={`chat-send-btn ${(!newMessage.trim() && !selectedImage) ? "disabled" : "active"}`}
            title="Send Message"
          >
            {sending ? (
              <div className="send-spinner"></div>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default ChatComposer;
