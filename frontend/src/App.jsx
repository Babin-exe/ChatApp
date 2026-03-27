import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import Signup from "./pages/Signup/Signup.jsx";
import Login from "./pages/Login/Login.jsx";
import Messages from "./pages/Messages.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
function App() {
  return (
    <>
      <SocketContextProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/message" element={<Messages />} />
        </Routes>
      </SocketContextProvider>
    </>
  );
}

export default App;
