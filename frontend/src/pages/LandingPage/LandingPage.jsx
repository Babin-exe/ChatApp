import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="page-wrap hero-page">
      <div className="hero-card">
        <p className="hero-kicker">Realtime Conversations</p>
        <h1 className="hero-title">
          Talk Faster On <span>ChatApplication</span>
        </h1>
        <p className="hero-subtitle">
          A clean chat workspace for quick, private conversations with one
          Google sign-in and instant messaging.
        </p>

        <div className="hero-actions">
          <Link to="/auth" className="ui-btn ui-btn-primary">
            Continue With Google
          </Link>

          <Link to="/auth" className="ui-btn ui-btn-outline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
