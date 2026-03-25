import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackgroundRippleEffect } from "../hero/background-ripple-effect";
import "./auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Backend logic will go here
  };

  return (
    <div className="auth-page">
      <BackgroundRippleEffect rows={14} cols={30} cellSize={52} interactive={true} />

      <div className="auth-card">
        <button className="auth-back" onClick={() => navigate("/")}>
          ← Back to home
        </button>

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your CoLBoard account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-submit">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <button className="auth-footer-link" onClick={() => navigate("/signup")}>
            Create one
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
