import React from "react";
import { BackgroundRippleEffect } from "./background-ripple-effect";
import "./hero.css";

const Home = ({ onStartDrawing, onNavigate }) => {
  return (
    <div className="hero-page">
      {/* Background ripple grid */}
      <BackgroundRippleEffect rows={14} cols={30} cellSize={52} interactive={true} />

      {/* Navigation */}
      <nav className="hero-nav">
        <div className="hero-nav-logo">
          <div className="hero-nav-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          CoLBoard
        </div>

        <div className="hero-nav-links">
          <span className="hero-nav-link">Features</span>
          <span className="hero-nav-link">About</span>
          <button className="hero-nav-cta" onClick={() => onNavigate("login")}>Login</button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          Real-time collaboration
        </div>

        <h1 className="hero-title">
          Sketch ideas<br />
          <span className="hero-title-accent">together, in real time.</span>
        </h1>

        <p className="hero-subtitle">
          A simple, collaborative whiteboard for your team.
          Draw, brainstorm, and bring ideas to life — all in one shared canvas.
        </p>

        <div className="hero-actions">
          <button className="hero-btn-primary" onClick={onStartDrawing}>Start Drawing</button>
          <button className="hero-btn-secondary">Learn More</button>
        </div>
      </main>

      {/* Bottom hint */}
      <div className="hero-hint">
        <span>Click anywhere on the grid</span>
        <span className="hero-hint-icon">↓</span>
      </div>
    </div>
  );
};

export default Home;
