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
}) => {
  return (
    <form className="chat-composer" onSubmit={handleSendMessage}>
      <input
        type="text"
        value={newMessage}
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
        disabled={sending || (!newMessage.trim() && !selectedImage) || !canMessage}
        className="ui-btn ui-btn-primary chat-send-btn"
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
};

export default ChatComposer;
