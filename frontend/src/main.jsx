import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { applyStoredTheme } from "./lib/theme.js";

const googleClientId = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;

if (!googleClientId) {
  console.error("Missing VITE_GOOGLE_AUTH_CLIENT_ID");
}

applyStoredTheme();



createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </BrowserRouter>
);
