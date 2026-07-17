import React, { useEffect, useRef, useState } from "react";
import { UseSocketContext } from "../../context/socketContext.js";
import toast from "react-hot-toast";
import api from "../../lib/api.js";

const ProfileCard = ({ setActiveView }) => {
  const { authUser, refreshAuthUser } = UseSocketContext();

  const inputRef = useRef(null);
  const nameInputRef = useRef(null);
  const [editedName, setEditedName] = useState(null);

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
    const name = editedName.trim();
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

  return (
    <>
      <div className="back_button">
        <button
          onClick={() => {
            setActiveView("default");
          }}
        >
          Back
        </button>
      </div>

      <div className="profile_main">
        <div className="profile_pic_wrapper">
          <img
            src={
              authUser.profilePic ||
              "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(authUser.name) +
                "&background=random"
            }
            alt={`${authUser.name}'s profile pic`}
            referrerPolicy="no-referrer"
            className="profile_pic_image"
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

        {editedName !== null ? (
          <>
            <div className="edit_name_input">
              <input
                type="text"
                ref={nameInputRef}
                value={editedName}
                onChange={(e) => {
                  setEditedName(e.target.value);
                }}
              />
              <div className="edit_name_buttons">
                <button
                  className="save_button"
                  disabled={editedName.trim() === authUser.name}
                  onClick={changeUserName}
                >
                  Save
                </button>

                <button
                  className="cancel_button"
                  onClick={() => {
                    setEditedName(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        ) : (
          <h2 className="profile_name">
            {authUser.name}
            <button
              onClick={() => {
                setEditedName(authUser?.name || null);
              }}
            >
              📝
            </button>
          </h2>
        )}

        <p>
          username :
          {authUser?.username
            ? authUser.username
            : "@" +
              authUser.name +
              authUser.name[0].toLocaleLowerCase() +
              authUser.name[authUser.name.length - 1].toLocaleLowerCase() +
              "_"}
        </p>

        <p className="profile_about">
          📝 About: {authUser.about || "No bio yet"}
        </p>

        <p className="profile_authenticator">
          <strong>Connected with :</strong>{" "}
          {authUser.authProvider.charAt(0).toUpperCase() +
            authUser.authProvider.slice(1)}
        </p>

        <p className="profile_email">
          <strong>Email:</strong> {authUser.email}
        </p>

        <p className="profile_creation">
          <strong>Member Since:</strong> {formatted}
        </p>
      </div>
    </>
  );
};

export default ProfileCard;
