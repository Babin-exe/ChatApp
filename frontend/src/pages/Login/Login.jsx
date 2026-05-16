import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../lib/api.js";
import { UseSocketContext } from "../../context/socketContext.js";


const Login = () => {
  const { refreshAuthUser } = UseSocketContext();
  const [formData, setData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post(`/api/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        const verifyRes = await api.get(`/api/auth/me`, {
          withCredentials: true,
        });

        if (verifyRes.data.success) {
          await refreshAuthUser();

          toast.success(response.data.message);

          navigate("/message");
        } else {
          toast.error("Session verification failed. Please login again");
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Something went wrong. Try again !";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap auth-page">
      <div className="auth-shell">
        <div className="auth-top">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Login to continue your conversations.</p>
        </div>


        <div>
          <GoogleLogin></GoogleLogin>
        </div>

        {/* <form className="auth-form" onSubmit={handleSubmit}>
          <input
            id="email"
            onChange={handleChange}
            className="auth-input"
            type="email"
            required
            placeholder="Email"
          />
          <input
            id="password"
            onChange={handleChange}
            className="auth-input"
            type="password"
            required
            minLength={8}
            placeholder="Password"
          />
          <button
            type="submit"
            disabled={loading}
            className="ui-btn ui-btn-primary"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="auth-footer">
            New here? <Link to="/signup">Create account</Link>
          </p>
        </form> */}
      </div>
    </div>
  );
};

export default Login;
