import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { applyStoredTheme } from "./lib/theme.js";

const googleClientId = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;

const showConsoleSecurityNotice = () => {
  if (typeof window === "undefined") return;

  console.info(
    "%cWait - why are you looking at the source code?",
    "color:#df5b5e;font-size:22px;font-weight:800;"
  );
};

if (!googleClientId) {
  console.error("Missing VITE_GOOGLE_AUTH_CLIENT_ID");
}

showConsoleSecurityNotice();
applyStoredTheme();



createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </BrowserRouter>
);
