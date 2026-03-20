import React, { useState } from "react";
import { BackgroundRippleEffect } from "../hero/background-ripple-effect";
import "./auth.css";

const Signup = ({ onNavigate }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Backend logic will go here
  };

  return (
    <div className="auth-page">
      <BackgroundRippleEffect rows={14} cols={30} cellSize={52} interactive={true} />

      <div className="auth-card">
        <button className="auth-back" onClick={() => onNavigate("home")}>
          ← Back to home
        </button>

        <div className="auth-header">
          <h1>Create an account</h1>
          <p>Get started with CoLBoard for free</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input
              className="auth-input"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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

          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-submit">
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <button className="auth-footer-link" onClick={() => onNavigate("login")}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
