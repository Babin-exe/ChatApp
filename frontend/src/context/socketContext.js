import { createContext, useContext } from "react";

export const SocketContext = createContext(null);
export const UseSocketContext = () => useContext(SocketContext);
