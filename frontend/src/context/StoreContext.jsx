import { createContext, useContext } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = ({ children }) => {
  const url = import.meta.env.VITE_BACKEND_URL;

  const contextValue = {
    url,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

export default StoreContextProvider;
