import React, { useState } from "react";
import "./ContactsPanel.css";

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
}) => {
  const [activeTab, setActiveTab] = useState("discover");

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
          Requests{" "}
          {incomingRequests?.length ? `(${incomingRequests.length})` : ""}
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
          {contacts.map((c) => {
            const isActive = selectedContact && selectedContact._id === c._id;

            return (
              <button
                key={c.chatId || c._id}
                type="button"
                onClick={() => onSelectContact(c)}
                className={`contact-item ${isActive ? "is-active" : ""}`}
              >
                <div className="contact-name">{c.name}</div>
                <div className="contact-email">{c.email}</div>

                {/* Some stuffs over here will be added soon  */}

                <button className="more-options">...</button>

                {/* This is the boundary  */}

                
              </button>
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
    </aside>
  );
};

export default ContactsPanel;
