import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import { apiRegister } from "../services/api";
import "./Auth.css";

const PersonIcon = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle
      cx="12"
      cy="7"
      r="4"
    />
  </svg>
);

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

const RegisterPage: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const theme = useContext(ThemeContext).theme;
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRegister(name.trim(), email.trim(), password);
      login(data.token, data.user);
      history.replace("/cycle-setup");
    } catch (err: unknown) {
      setError((err as Error).message || "Registration failed");
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
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join OVIFLOW and track your cycle</p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            handleSubmit(e).catch((err) => console.error(err));
          }}
        >
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-input-group">
            <span className="auth-input-icon">
              <PersonIcon />
            </span>
            <input
              id="reg-name"
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="auth-input-group">
            <span className="auth-input-icon">
              <MailIcon />
            </span>
            <input
              id="reg-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <span className="auth-input-icon">
              <LockIcon />
            </span>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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

          <button
            type="submit"
            className="auth-btn auth-btn-primary"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <div className="auth-link-row">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => history.push("/login")}
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
