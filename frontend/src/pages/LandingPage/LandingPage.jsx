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
          A clean chat workspace for quick, private conversations with smooth
          login and instant messaging.
        </p>

        <div className="hero-actions">
          <Link to="/signup" className="ui-btn ui-btn-primary">
            Create Account
          </Link>

          <Link to="/login" className="ui-btn ui-btn-outline">
            I Have An Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
