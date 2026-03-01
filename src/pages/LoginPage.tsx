import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import { apiLogin } from "../services/api";
import "./Auth.css";

const LoginPage: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const theme = useContext(ThemeContext).theme;
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <div className="auth-card">
        <div className="auth-logo">
          <img
            src="/assets/icon/LOGO.png"
            alt="OVIFLOW"
            className="auth-logo-img"
          />
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your OVIFLOW account</p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            handleSubmit(e).catch((err) => console.error(err));
          }}
        >
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
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
