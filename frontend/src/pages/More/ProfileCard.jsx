import React, { useEffect, useRef, useState } from "react";
import { UseSocketContext } from "../../context/socketContext.js";
import toast from "react-hot-toast";
import api from "../../lib/api.js";

const ProfileCard = ({ setActiveView }) => {
  const { authUser, refreshAuthUser } = UseSocketContext();

  const inputRef = useRef(null);
  const nameInputRef = useRef(null);
  const [editedName, setEditedName] = useState(null);

  //Use these later
  const bioInputRef = useRef(null);
  const [editedBio, setEditedBio] = useState(null);

  const date = new Date(authUser?.createdAt);

  const formatted = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (editedName !== null) {
      nameInputRef?.current?.focus();
    }
  }, [editedName]);

  useEffect(() => {
    if (editedBio !== null) {
      bioInputRef?.current?.focus();
    }
  }, [editedBio]);

  if (!authUser) return null;

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      await api.patch("/api/auth/update-profile", formData);
      toast("Profile updated successfully", { icon: "✅" });

      if (refreshAuthUser) {
        refreshAuthUser();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const changeUserName = async () => {
    const name = editedName?.trim();
    if (!name) {
      toast.error("Name cannot be empty ");
      return;
    }
    try {
      await api.patch("/api/auth/update_name", { name: name });

      await refreshAuthUser();
      toast.success("Name changed.");
      setEditedName(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update name");
    }
  };

  const changeBio = async () => {
    const bio = editedBio?.trim();
    if (!bio) {
      toast.error("Bio cannot be empty");
      return;
    }

    try {
      console.log("This is what we have: " + editedBio);

      await api.patch("/api/auth/update_bio", { bio: editedBio });

      await refreshAuthUser();
      toast.success("Bio Updated");
      setEditedBio(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update the bio");
    }
  };

  return (
    <div className="profile-full-page">
      <header className="profile-full-header">
        <div className="back_button" style={{ margin: 0, alignSelf: "center" }}>
          <button onClick={() => setActiveView("default")}>Back</button>
        </div>
        <h1>Your Profile</h1>
      </header>

      <div className="profile-full-body">
        <div className="profile-pic-section">
          <div className="profile_pic_wrapper">
            <img
              src={
                authUser.profilePic ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(authUser.name) +
                  "&background=random"
              }
              alt="Profile"
              className="profile_pic_image"
              referrerPolicy="no-referrer"
            />
            <button
              className="profile_pic_edit_btn"
              title="Change Profile Picture"
              onClick={() => inputRef.current?.click()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={inputRef}
              style={{ display: "none" }}
              onChange={handleProfilePicChange}
            />
          </div>
        </div>

        <div className="profile-section-card">
          <div className="profile-section-label">Your Name</div>

          {editedName !== null ? (
            <div className="profile-inline-edit">
              <input
                type="text"
                ref={nameInputRef}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="profile-inline-input"
              />
              <div className="profile-inline-actions">
                <button
                  className="profile-action-btn"
                  onClick={() => setEditedName(null)}
                >
                  Cancel
                </button>
                <button
                  className="profile-action-btn save"
                  onClick={changeUserName}
                  disabled={editedName.trim() === authUser.name}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-section-content">
              <span className="profile-section-value">{authUser.name}</span>
              <button
                className="profile-edit-btn"
                onClick={() => setEditedName(authUser?.name || null)}
              >
                <img width={20} height={20} src="./edit.png" alt="edit" />
              </button>
            </div>
          )}

          <div className="profile-helper-text">
            This is not your username or pin. This name will be visible to your
            contacts.
          </div>
        </div>

        <div className="profile-section-card">
          <div className="profile-section-label">Username</div>
          <div className="profile-section-content">
            <span className="profile-section-value">
              {authUser?.username
                ? authUser.username
                : "@" +
                  authUser.name +
                  authUser.name[0].toLowerCase() +
                  authUser.name[authUser.name.length - 1].toLowerCase() +
                  "_"}
            </span>
          </div>
        </div>

        <div className="profile-section-card">
          <div className="profile-section-label">About</div>
          
          {editedBio !== null ? (
            <div className="profile-inline-edit">
              <input
                type="text"
                ref={bioInputRef}
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="profile-inline-input"
              />
              <div className="profile-inline-actions">
                <button
                  className="profile-action-btn"
                  onClick={() => setEditedBio(null)}
                >
                  Cancel
                </button>
                <button
                  className="profile-action-btn save"
                  onClick={changeBio}
                  disabled={editedBio.trim() === (authUser?.about || "Available")}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-section-content">
              <span className="profile-section-value">
                {authUser.about || "Available"}
              </span>
              <button
                className="profile-edit-btn"
                onClick={() => setEditedBio(authUser?.about || "Available")}
              >
                <img width={20} height={20} src="./edit.png" alt="edit" />
              </button>
            </div>
          )}
        </div>

        <div className="profile-section-card">
          <div className="profile-section-label">Account Details</div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <div
                style={{
                  color: "#69717f",
                  fontSize: "0.9rem",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                Email
              </div>
              <div className="profile-section-value">{authUser.email}</div>
            </div>
            <div>
              <div
                style={{
                  color: "#69717f",
                  fontSize: "0.9rem",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                Connected via
              </div>
              <div className="profile-section-value">
                {authUser.authProvider.charAt(0).toUpperCase() +
                  authUser.authProvider.slice(1)}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "#69717f",
                  fontSize: "0.9rem",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                Member Since
              </div>
              <div className="profile-section-value">{formatted}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
