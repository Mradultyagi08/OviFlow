import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import { apiLogin } from "../services/api";
import "./Auth.css";

const MailIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="3"
    />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
    />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle
      cx="12"
      cy="12"
      r="3"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line
      x1="1"
      y1="1"
      x2="23"
      y2="23"
    />
  </svg>
);

const LoginPage: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const theme = useContext(ThemeContext).theme;
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiLogin(email.trim(), password);
      login(data.token, data.user);

      if (!data.user.isOnboarded) {
        history.replace("/cycle-setup");
      } else {
        history.replace("/OVIFLOW/");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page ${isDark ? "dark" : ""}`}>
      <div className="auth-hero-section">
        <div className="auth-hero-logo">
          <img
            src="/assets/icon/LOGO.png"
            alt="OVIFLOW"
            className="auth-hero-logo-img"
          />
        </div>
        <h2 className="auth-brand-name">OVIFLOW</h2>
        <p className="auth-brand-tagline">
          Your Personal Women&apos;s Health Companion
        </p>
      </div>
      <div className="auth-card">
        <h1 className="auth-title">W E L C O M E </h1>
        <p className="auth-subtitle">Log in to continue</p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            handleSubmit(e).catch((err) => console.error(err));
          }}
        >
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-input-group">
            <span className="auth-input-icon">
              <MailIcon />
            </span>
            <input
              id="login-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-input-group">
            <span className="auth-input-icon">
              <LockIcon />
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div className="auth-forgot-row">
            <button
              type="button"
              className="auth-forgot-link"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn-primary"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Log In"}
          </button>
        </form>

        <div className="auth-link-row">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => history.push("/register")}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
