import React, { useState } from "react";
import "./ContactsPanel.css";
import { UseSocketContext } from "../context/socketContext";

const ContactsPanel = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchText,
  onSearchTextChange,
  onSearchUsers,
  discoverLoading,
  discoverUsers,
  incomingRequests,
  requestsLoading,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  actionLoadingId,
  blockedUsers = [],
  blockedLoading = false,
  onBlockUser,
  onUnblockUser,
}) => {
  const { onlineUsers } = UseSocketContext();
  const [activeTab, setActiveTab] = useState("discover");
  const [openMenuContactId, setOpenMenuContactId] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);

  const blockTargetKey = blockTarget ? `block-${blockTarget._id}` : "";
  const blockingTarget = actionLoadingId === blockTargetKey;

  const selectContact = (contact) => {
    setOpenMenuContactId(null);
    onSelectContact(contact);
  };

  const toggleContactMenu = (contactId) => {
    setOpenMenuContactId((current) =>
      current === contactId ? null : contactId,
    );
  };

  const requestBlockConfirmation = (contact) => {
    setBlockTarget(contact);
    setOpenMenuContactId(null);
  };

  const confirmBlock = async () => {
    if (!blockTarget?._id || !onBlockUser) return;

    const blocked = await onBlockUser(blockTarget._id);
    if (blocked) {
      setBlockTarget(null);
    }
  };

  return (
    <aside className="contacts-panel">
      <div className="contacts-header">
        <h2>Contacts</h2>
        <p>
          {contacts.length} active chat{contacts.length <= 1 ? "" : "s"}
        </p>
      </div>

      <div className="button-options">
        <button
          type="button"
          className={activeTab === "contacts" ? "tab-active" : ""}
          onClick={() => setActiveTab("contacts")}
        >
          Contacts
        </button>

        <button
          type="button"
          className={activeTab === "discover" ? "tab-active" : ""}
          onClick={() => setActiveTab("discover")}
        >
          Discover
        </button>

        <button
          type="button"
          className={activeTab === "requests" ? "tab-active" : ""}
          onClick={() => setActiveTab("requests")}
        >
          <span className="tab-label">Requests</span>
          {incomingRequests?.length ? (
            <span className="tab-count">({incomingRequests.length})</span>
          ) : null}
        </button>

        <button
          type="button"
          className={activeTab === "blocked" ? "tab-active" : ""}
          onClick={() => setActiveTab("blocked")}
        >
          <span className="tab-label">Blocked</span>
          {blockedUsers.length ? (
            <span className="tab-count">({blockedUsers.length})</span>
          ) : null}
        </button>
      </div>

      {activeTab === "discover" && (
        <>
          <div className="search_bar">
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchTextChange(e.target.value)}
              placeholder="Search people"
            />

            <button
              type="button"
              onClick={onSearchUsers}
              disabled={discoverLoading}
              className="search_users"
            >
              {discoverLoading ? "Searching..." : "Search"}
            </button>
          </div>

          <div className="discover-list">
            {discoverLoading && <p className="panel-empty">Searching...</p>}

            {!discoverLoading && (discoverUsers || []).length === 0 && (
              <p className="panel-empty">No users found.</p>
            )}

            {!discoverLoading &&
              (discoverUsers || []).map((user) => {
                const requestKey = `request-${user._id}`;
                const isSending = actionLoadingId === requestKey;

                return (
                  <div key={user._id} className="discover-item">
                    <div className="discover-user">
                      <div className="discover-name">{user.name}</div>
                      <div className="discover-email">{user.email}</div>
                    </div>

                    <button
                      type="button"
                      className="request-btn"
                      onClick={() => onSendRequest(user._id)}
                      disabled={isSending}
                    >
                      {isSending ? "Sending..." : "Request"}
                    </button>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {activeTab === "contacts" && (
        <div className="contacts-list">
          {contacts.length === 0 && (
            <p className="panel-empty">No active contacts</p>
          )}

          {contacts.map((c) => {
            const isActive = selectedContact && selectedContact._id === c._id;
            const isMenuOpen = openMenuContactId === c._id;
            const isOnline = onlineUsers?.has(String(c?._id));

            return (
              <div
                key={c.chatId || c._id}
                className={`contact-item ${isActive ? "is-active" : ""}`}
              >
                <button
                  type="button"
                  className="contact-select"
                  onClick={() => selectContact(c)}
                >
                  <div className="contact-name">
                    <span
                      className={`presence-dot ${isOnline ? "is-online" : "is-offline"}`}
                      aria-label={isOnline ? "Online" : "Offline"}
                      role="img"
                    />
                    {c.name}
                    {!c.canMessage && (
                      <span className="contact-badge">
                        {c.blockedByCurrentUser ? "Blocked" : "Blocked you"}
                      </span>
                    )}
                  </div>
                  <div className="contact-email">{c.email}</div>
                </button>

                <button
                  type="button"
                  className="more-options"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  aria-label={`Open options for ${c.name}`}
                  onClick={() => toggleContactMenu(c._id)}
                >
                  ...
                </button>

                {isMenuOpen && (
                  <div className="contact-menu" role="menu">
                    <button type="button" role="menuitem" disabled>
                      View profile
                    </button>
                    <button type="button" role="menuitem" disabled>
                      Mute notifications
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="danger-option"
                      onClick={() => requestBlockConfirmation(c)}
                    >
                      Block
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="requests-list">
          {requestsLoading && (
            <p className="panel-empty">Loading requests...</p>
          )}

          {!requestsLoading && (incomingRequests || []).length === 0 && (
            <p className="panel-empty">No incoming requests</p>
          )}

          {!requestsLoading &&
            (incomingRequests || []).map((request) => {
              const acceptKey = `accept-${request.chatId}`;
              const declineKey = `decline-${request.chatId}`;

              const accepting = actionLoadingId === acceptKey;
              const declining = actionLoadingId === declineKey;
              const isBusy = accepting || declining;

              return (
                <div
                  key={request.chatId}
                  className={`request-container ${isBusy ? "is-busy" : ""}`}
                >
                  <div className="req-user">
                    <div className="req-name">
                      {request.from?.name || "Unknown"}
                    </div>
                    <div className="req-email">{request.from?.email || ""}</div>
                  </div>

                  <div className="req-button">
                    <button
                      type="button"
                      disabled={accepting}
                      onClick={() => onAcceptRequest(request.chatId)}
                    >
                      {accepting ? "Accepting..." : "Accept"}
                    </button>

                    <button
                      type="button"
                      disabled={declining}
                      onClick={() => onDeclineRequest(request.chatId)}
                    >
                      {declining ? "Declining..." : "Decline"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {activeTab === "blocked" && (
        <div className="blocked-list">
          {blockedLoading && (
            <p className="panel-empty">Loading Blocked Users...</p>
          )}

          {!blockedLoading && blockedUsers.length === 0 && (
            <p className="panel-empty">No blocked users. </p>
          )}

          {!blockedLoading &&
            blockedUsers.map((entry) => {
              const user = entry.blocked;
              if (!user?._id) return null;

              const key = `unblock-${user?._id}`;
              const isBusy = actionLoadingId === key;

              return (
                <div key={entry._id || user._id} className="request-container">
                  <div className="req-user">
                    <div className="req-name">{user?.name}</div>
                    <div className="req-email">{user?.email}</div>
                  </div>

                  <div className="req-button">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        onUnblockUser(user._id);
                      }}
                    >
                      {isBusy ? "Unblocking..." : "Unblock"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {blockTarget && (
        <div className="block-confirm-backdrop" role="presentation">
          <section
            className="block-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-confirm-title"
          >
            <h3 id="block-confirm-title">Block {blockTarget.name}?</h3>
            <p>
              This contact will be removed from your chats and they will not be
              able to message you.
            </p>

            <div className="block-confirm-actions">
              <button
                type="button"
                onClick={() => setBlockTarget(null)}
                disabled={blockingTarget}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-option"
                onClick={confirmBlock}
                disabled={blockingTarget}
              >
                {blockingTarget ? "Blocking..." : "Yes, block"}
              </button>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
};

export default ContactsPanel;
