const Themes = ({ setActiveView }) => {
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
      This is Themes
    </>
  );
};

export default Themes;
