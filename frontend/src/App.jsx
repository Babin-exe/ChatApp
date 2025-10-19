import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import StoreContextProvider from "./context/StoreContext.jsx";

function App() {
  return (
    <>
      <StoreContextProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </StoreContextProvider>
    </>
  );
}

export default App;
