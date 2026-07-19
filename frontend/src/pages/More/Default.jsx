import { useNavigate } from "react-router-dom";
import { UseSocketContext } from "../../context/socketContext.js";

const Default = ({ setActiveView }) => {
  const navigate = useNavigate();
  const { authUser } = UseSocketContext();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>More Options</h1>
        <p>Manage your account, appearance, and settings</p>
      </header>

      <div className="dashboard-grid">
        <button className="dashboard-card profile-card" onClick={() => setActiveView("profile")}>
          <div className="card-icon">
            <img src={authUser?.profilePic || "./rick.jpeg"} alt="" />
          </div>
          <h3>Profile</h3>
          <p>Edit your personal information and avatar</p>
        </button>

        <button className="dashboard-card themes-card" onClick={() => setActiveView("themes")}>
          <div className="card-icon">
            <img src="./themes.png" alt="" />
          </div>
          <h3>Themes</h3>
          <p>Customize the look and feel of the app</p>
        </button>

        <button className="dashboard-card settings-card" onClick={() => setActiveView("settings")}>
          <div className="card-icon">
            <img src="./stng.png" alt="" />
          </div>
          <h3>Settings</h3>
          <p>Configure notifications and preferences</p>
        </button>

        <button className="dashboard-card back-card" onClick={() => navigate("/message")}>
          <div className="card-icon">
            <img src="./chat.png" alt="" />
          </div>
          <h3>Back to Chats</h3>
          <p>Return to your conversations</p>
        </button>
      </div>
    </div>
  );
};

export default Default;
