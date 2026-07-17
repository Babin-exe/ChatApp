import { useNavigate } from "react-router-dom";

const Default = ({ setActiveView }) => {
  const navigate = useNavigate();

  return (
    <div className="menu_top">
      <div className="option_profile moreOption">
        <button onClick={() => setActiveView("profile")}>Profile</button>
      </div>
      <div className="option_themes moreOption">
        <button onClick={() => setActiveView("themes")}>Themes</button>
      </div>
      <div className="option_settings moreOption">
        <button onClick={() => setActiveView("settings")}>Settings</button>
      </div>

      <div className="option_home moreOption menu_home_row">
        <button onClick={() => navigate("/message")}>Back to Chats</button>
      </div>
    </div>
  );
};

export default Default;
