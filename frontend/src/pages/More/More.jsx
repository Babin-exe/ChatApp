import React, { useState } from "react";
import ProfileCard from "./ProfileCard.jsx";
import Themes from "./Themes.jsx";
import Settings from "./Settings.jsx";
import "./More.css";

const More = () => {

  const [activeView, setActiveView] = useState("default");
  const VIEWS = {
    profile: <ProfileCard />,
    themes: <Themes />,
    settings: <Settings />
  };

  return (
    <>
      <div className="menu_top">


        <div className="default_view">
          <button onClick={() => setActiveView("profile")}>Profile</button>
          <button onClick={() => setActiveView("themes")}>Themes</button>
          <button onClick={() => setActiveView("settings")}>Settings</button>
        </div>

        <div className="content_view">
          {VIEWS[activeView]}
        </div>
      </div>
    </>
  );
};

export default More;
