import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../lib/api.js";
import { UseSocketContext } from "../../context/socketContext.js";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";

const GOOGLE_BUTTON_MOBILE_WIDTH = "280";
const GOOGLE_BUTTON_DESKTOP_WIDTH = "360";

const Login = () => {
  const { refreshAuthUser } = UseSocketContext();
  const [loading, setLoading] = useState(false);
  const isCompact = useMediaQuery("(max-width: 430px)");
  const navigate = useNavigate();

  const handleGoogleSuccess = async ({ credential }) => {
    if (!credential) {
      toast.error("Google did not return a credential");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/auth/google", { credential });

      if (res.data.success) {
        await refreshAuthUser();
        toast.success(res.data.message || "Login successful");
        navigate("/message");
        return;
      }

      toast.error(res.data.message || "Google login failed");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap auth-page">
      <div className="auth-shell">
        <div className="auth-top">
          <h1 className="auth-title">Continue to ChatApplication</h1>
          <p className="auth-subtitle">
            Use Google to sign in or create your account instantly.
          </p>
        </div>

        <div className="auth-form auth-google-form">
          <div className="google-auth-button">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google login failed")}
              size="large"
              text="continue_with"
              shape="rectangular"
              theme="outline"
              logo_alignment="left"
              width={
                isCompact
                  ? GOOGLE_BUTTON_MOBILE_WIDTH
                  : GOOGLE_BUTTON_DESKTOP_WIDTH
              }
            />
          </div>

          <p className="auth-footer">
            {loading
              ? "Signing you in..."
              : "New or returning, the same button gets you in."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
