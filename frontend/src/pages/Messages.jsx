import React, { useCallback, useEffect, useState } from "react";
import "./Messages.css";
import ContactsPanel from "./ContactsPanel.jsx";
import ChatPanel from "./ChatPanel/ChatPanel.jsx";
import { toast } from "react-hot-toast";
import api from "../lib/api.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { UseSocketContext } from "../context/socketContext.js";

const MOBILE_BREAKPOINT = "(max-width: 768px)";

const Messages = () => {
  const isMobileLayout = useMediaQuery(MOBILE_BREAKPOINT);
  const [contacts, setContacts] = useState([]);

  const [selectedContact, setSelectedContact] = useState(null);

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState("");
  const [incomingRequests, setIncomingRequest] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const { setSelectedContactInContext } = UseSocketContext();

  const fetchContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      setContactsError("");
      const res = await api.get(`/api/chats/contacts`);
      setContacts(res.data.contacts || []);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load contacts. Please retry.";
      setContactsError(message);
      toast.error(message);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const fetchIncomingRequest = useCallback(async () => {
    try {
      setRequestsLoading(true);
      const res = await api.get("/api/chats/requests/incoming");
      setIncomingRequest(res.data.requests || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load incoming request"
      );
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const fetchDiscoverUsers = useCallback(async (q = "") => {
    try {
      setDiscoverLoading(true);
      const res = await api.get(
        `/api/chats/discover?q=${encodeURIComponent(q)}`
      );
      setDiscoverUsers(res.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to discover users");
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      setBlockedLoading(true);
      const res = await api.get("/api/access/blocked-users");
      setBlockedUsers(res.data?.blockedUsers || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load blocked users"
      );
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  const handleSearchUsers = () => fetchDiscoverUsers(searchText);

  useEffect(() => {
    fetchContacts();
    fetchIncomingRequest();
    fetchDiscoverUsers();
    fetchBlockedUsers();
  }, [
    fetchContacts,
    fetchIncomingRequest,
    fetchDiscoverUsers,
    fetchBlockedUsers,
  ]);

  useEffect(() => {
    setSelectedContactInContext(selectedContact?._id);
  }, [selectedContact]);

  const handleSendRequest = async (receiverId) => {
    const key = `request-${receiverId}`;
    try {
      setActionLoadingId(key);
      await api.post(`/api/chats/request/${receiverId}`);
      toast.success("Message Request is sent");
      await fetchDiscoverUsers(searchText);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleAcceptRequest = async (chatId) => {
    const key = `accept-${chatId}`;
    try {
      setActionLoadingId(key);
      await api.post(`/api/chats/accept/${chatId}`);
      toast.success("Request accepted");
      await fetchContacts();
      await fetchIncomingRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeclineRequest = async (chatId) => {
    const key = `decline-${chatId}`;
    try {
      setActionLoadingId(key);
      await api.post(`/api/chats/decline/${chatId}`);
      toast.success("Request declined");
      await fetchIncomingRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decline request");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBlockUser = async (blockedId) => {
    const key = `block-${blockedId}`;
    try {
      setActionLoadingId(key);
      await api.post(`/api/access/block/${blockedId}`);
      toast.success("User blocked successfully");

      setSelectedContact((current) =>
        current?._id === blockedId ? null : current
      );

      await Promise.all([
        fetchContacts(),
        fetchIncomingRequest(),
        fetchDiscoverUsers(searchText),
        fetchBlockedUsers(),
      ]);

      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block the user");
      return false;
    } finally {
      setActionLoadingId("");
    }
  };

  const handleUnblockUser = async (blockedId) => {
    const key = `unblock-${blockedId}`;
    try {
      setActionLoadingId(key);
      await api.post(`/api/access/unblock/${blockedId}`);

      toast.success("User Unblocked");

      await Promise.all([
        fetchBlockedUsers(),
        fetchDiscoverUsers(searchText),
        fetchContacts(),
        fetchIncomingRequest(),
      ]);

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to unblock the user"
      );
      return false;
    } finally {
      setActionLoadingId("");
    }
  };

  if (loadingContacts) {
    return (
      <div className="messages-page">
        <div className="messages-state">
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (contactsError && contacts.length === 0) {
    return (
      <div className="messages-page">
        <div className="messages-state">
          <div className="messages-error-card">
            <p>{contactsError}</p>
            <button
              type="button"
              onClick={fetchContacts}
              className="ui-btn ui-btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const shellClassName = [
    "messages-shell",
    isMobileLayout ? "messages-shell--mobile" : "",
    isMobileLayout && selectedContact ? "messages-shell--chat-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="messages-page">
      <div className={shellClassName}>
        <div className="messages-sidebar">
          <ContactsPanel
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={setSelectedContact}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            onSearchUsers={handleSearchUsers}
            discoverUsers={discoverUsers}
            discoverLoading={discoverLoading}
            blockedLoading={blockedLoading}
            incomingRequests={incomingRequests}
            requestsLoading={requestsLoading}
            onSendRequest={handleSendRequest}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            actionLoadingId={actionLoadingId}
            onUnblockUser={handleUnblockUser}
            onBlockUser={handleBlockUser}
            blockedUsers={blockedUsers}
          />
        </div>
        <div className="messages-chat">
          <ChatPanel
            selectedContact={selectedContact}
            onUnblockUser={handleUnblockUser}
            actionLoadingId={actionLoadingId}
            blockedUsers={blockedUsers}
            onBack={
              isMobileLayout && selectedContact
                ? () => setSelectedContact(null)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
