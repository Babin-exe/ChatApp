import React from "react";

const ChatHeader = ({
  onBack,
  selectedContact,
  selectedContactId,
  typingUsers,
  selectedContactIsOnline,
  isBlockedByMe,
  handleUnblock,
  unblocking,
  statusLoading,
}) => {
  return (
    <header className="chat-header">
      {onBack && (
        <button
          type="button"
          className="chat-back-btn"
          onClick={onBack}
          aria-label="Back to contacts"
        >
          Back
        </button>
      )}

      <div className="chat-header-text">
        <h2>{selectedContact.name}</h2>

        {typingUsers.has(String(selectedContactId)) && (
          <div className="typing-indicator-wrapper">
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="typing-text">
              {selectedContact.name} is typing...
            </span>
          </div>
        )}

        <p className="chat-subtitle">
          <span
            className={`presence-dot ${
              selectedContactIsOnline ? "is-online" : "is-offline"
            }`}
            aria-hidden="true"
          />
          <span>{selectedContactIsOnline ? "Online" : "Offline"}</span>
        </p>
      </div>

      <span className="header-unblock">
        {isBlockedByMe && (
          <button
            type="button"
            className="chat-link-btn"
            onClick={handleUnblock}
            disabled={unblocking || statusLoading}
          >
            {unblocking ? "Unblocking..." : "Unblock"}
          </button>
        )}
      </span>
    </header>
  );
};

export default ChatHeader;
