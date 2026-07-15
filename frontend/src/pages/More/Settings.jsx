const Settings = ({ setActiveView }) => {
  return (
    <>
      Settings..
      <div className="back_button">
        <button
          onClick={() => {
            setActiveView("default");
          }}
        >
          Back
        </button>
      </div>
    </>
  );
};

export default Settings;
