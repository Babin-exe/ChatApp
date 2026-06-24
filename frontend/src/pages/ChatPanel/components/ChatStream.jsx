import ChatMessageItem from "./ChatMessageItem.jsx";

const ChatStream = ({
  chatStreamRef,
  handleScroll,
  loadingOlder,
  messagesError,
  reloadMessages,
  loadingMessages,
  messages,
  lastOutgoingIndex,
  getSenderId,
  selectedContact,
  currentMessageId,
  setCurrentMessageId,
  pickerMode,
  setPickerMode,
  PickerMode,
  showMessageStatus,
  lastOutgoingTimeAgo,
}) => {
  return (
    <article
      className="chat-stream"
      ref={chatStreamRef}
      onScroll={handleScroll}
    >
      {loadingOlder && (
        <p className="chat-meta chat-loading-older">Loading older messages...</p>
      )}

      {messagesError && (
        <div className="chat-alert">
          <p>{messagesError}</p>
          <button
            type="button"
            onClick={reloadMessages}
            disabled={loadingMessages}
            className="chat-link-btn"
          >
            {loadingMessages ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}

      {loadingMessages && messages.length === 0 && (
        <p className="chat-meta">Loading messages...</p>
      )}

      {messages.map((m, idx) => {
        const isLastOutgoing = idx === lastOutgoingIndex;
        return (
          <ChatMessageItem
            key={m._id}
            m={m}
            isIncoming={getSenderId(m) === selectedContact._id}
            isLastOutgoing={isLastOutgoing}
            currentMessageId={currentMessageId}
            setCurrentMessageId={setCurrentMessageId}
            pickerMode={pickerMode}
            setPickerMode={setPickerMode}
            PickerMode={PickerMode}
            showMessageStatus={showMessageStatus}
            lastOutgoingTimeAgo={lastOutgoingTimeAgo}
          />
        );
      })}

      {!loadingMessages && messages.length === 0 && (
        <p className="chat-meta">No messages yet.</p>
      )}
    </article>
  );
};

export default ChatStream;
