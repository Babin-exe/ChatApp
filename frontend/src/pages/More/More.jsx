import React, { useState } from "react";
import ProfileCard from "./ProfileCard.jsx";
import Themes from "./Themes.jsx";
import Settings from "./Settings.jsx";
import "./More.css";
import Default from "./Default.jsx";

const More = () => {
  const [activeView, setActiveView] = useState("default");
  
  const VIEWS = {
    profile: <ProfileCard setActiveView={setActiveView} />,
    themes: <Themes setActiveView={setActiveView} />,
    settings: <Settings setActiveView={setActiveView} />,
    default: <Default setActiveView={setActiveView} />,
  };

  return (
    <>
      <div className="content_view">{VIEWS[activeView]}</div>
    </>
  );
};

export default More;
