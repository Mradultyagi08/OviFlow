import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import { apiRegister } from "../services/api";
import "./Auth.css";

const RegisterPage: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const theme = useContext(ThemeContext).theme;
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRegister(name.trim(), email.trim(), password);
      // Automatically log the user in after registration
      login(data.token, data.user);
      // New user always goes to cycle setup first
      history.replace("/cycle-setup");
    } catch (err: unknown) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page ${isDark ? "dark" : ""}`}>
      <div className="auth-card">
        <div className="auth-logo">
          <img
            src="/assets/icon/LOGO.png"
            alt="OVIFLOW"
            className="auth-logo-img"
          />
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join OVIFLOW and track your cycle</p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            handleSubmit(e).catch((err) => console.error(err));
          }}
        >
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
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
