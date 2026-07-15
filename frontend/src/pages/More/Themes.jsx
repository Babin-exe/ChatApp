const Themes = ({ setActiveView }) => {
  return (
    <>
      <button
        onClick={() => {
          setActiveView("default");
        }}
      >
        Back
      </button>
      This is Themes
    </>
  );
};

export default Themes;
