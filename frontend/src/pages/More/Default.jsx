const Default = ({ setActiveView }) => {
  return (
    <div className="menu_top">
      <div className="default_view">
        <div>
          <button onClick={() => setActiveView("profile")}>Profile</button>
        </div>
        <div>
          <button onClick={() => setActiveView("themes")}>Themes</button>
        </div>
        <div>
          <button onClick={() => setActiveView("settings")}>Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Default;
