import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import api from "../../lib/api.js";
import { UseSocketContext } from "../../context/socketContext.js";

const Signup = () => {
  const { refreshAuthUser } = UseSocketContext();
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const item = e.target.id;
    const value = e.target.value;
    setData((prev) => ({ ...prev, [item]: value }));
  };



  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/auth/signup`, {
        name: data.name,
        email: data.email,
        password: data.password,
        profilePic: "",
      });
      toast.success("Verification email sent! Please check your inbox.");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap auth-page">
      <div className="auth-shell">
        <div className="auth-top">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Sign up once and start chatting in seconds.
          </p>
        </div>



        <form onSubmit={handleSignin} className="auth-form">
          <input
            id="name"
            onChange={handleChange}
            type="text"
            placeholder="Full Name"
            required
            className="auth-input"
          />
          <input
            id="email"
            onChange={handleChange}
            type="email"
            placeholder="Email"
            required
            className="auth-input"
          />
          <input
            id="password"
            onChange={handleChange}
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="auth-input"
          />
          <button
            disabled={loading}
            type="submit"
            className="ui-btn ui-btn-primary"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
