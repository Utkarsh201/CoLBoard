import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BackgroundRippleEffect } from "../hero/background-ripple-effect";
import { CanvasContext } from "../store/CanvasHistory";
import "./auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useContext(CanvasContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/board", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });
      toast.success("Welcome back.");
      navigate("/board", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <BackgroundRippleEffect rows={14} cols={30} cellSize={52} interactive />

      <div className="auth-card">
        <button className="auth-back" onClick={() => navigate("/")}>
          {"<-"} Back to home
        </button>

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your CoLBoard workspace and rejoin the board.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          <p className="auth-helper">Your session will reconnect to realtime collaboration automatically.</p>

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{" "}
          <button className="auth-footer-link" onClick={() => navigate("/signup")}>
            Create one
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
