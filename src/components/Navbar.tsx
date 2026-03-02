import React, { useContext, useState, useRef, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import "./Navbar.css";

/* ── SVG Icons ────────────────────────────────────────── */

const SunIcon = () => (
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
    <circle
      cx="12"
      cy="12"
      r="5"
    />
    <line
      x1="12"
      y1="1"
      x2="12"
      y2="3"
    />
    <line
      x1="12"
      y1="21"
      x2="12"
      y2="23"
    />
    <line
      x1="4.22"
      y1="4.22"
      x2="5.64"
      y2="5.64"
    />
    <line
      x1="18.36"
      y1="18.36"
      x2="19.78"
      y2="19.78"
    />
    <line
      x1="1"
      y1="12"
      x2="3"
      y2="12"
    />
    <line
      x1="21"
      y1="12"
      x2="23"
      y2="12"
    />
    <line
      x1="4.22"
      y1="19.78"
      x2="5.64"
      y2="18.36"
    />
    <line
      x1="18.36"
      y1="5.64"
      x2="19.78"
      y2="4.22"
    />
  </svg>
);

const MoonIcon = () => (
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
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="16"
    height="16"
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

const SettingsIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="12"
      r="3"
    />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
    />
  </svg>
);

/* ── Helpers ──────────────────────────────────────────── */

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Component ────────────────────────────────────────── */

const Navbar: React.FC = () => {
  const history = useHistory();
  const { theme, updateTheme } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    updateTheme(isDark ? "light" : "dark");
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    history.push("/login");
  };

  const handleViewProfile = () => {
    setDropdownOpen(false);
    // TODO: navigate to a dedicated profile page if created
  };

  const handleSettings = () => {
    setDropdownOpen(false);
    history.push("/settings");
  };

  const initials = user ? getInitials(user.name) : "?";

  return (
    <nav className={`app-navbar ${isDark ? "dark" : "light"}`}>
      {/* ── Left: Branding ── */}
      <div
        className="navbar-brand"
        onClick={() => history.push("/OVIFLOW/")}
      >
        <img
          src="/assets/icon/LOGO'small.png"
          alt="OVIFLOW"
          className="navbar-logo"
        />
        <span className="navbar-title">OVIFLOW</span>
      </div>

      {/* ── Right: Actions ── */}
      <div className="navbar-actions">
        {/* Theme toggle */}
        <button
          className={`navbar-icon-btn theme-toggle ${isDark ? "dark" : "light"}`}
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Profile avatar + dropdown */}
        <div
          className="navbar-profile-wrapper"
          ref={dropdownRef}
        >
          <button
            className={`navbar-avatar ${isDark ? "dark" : "light"}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="Profile menu"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div className={`navbar-dropdown ${isDark ? "dark" : "light"}`}>
              <div className="dropdown-header">
                <span className="dropdown-user-name">
                  {user?.name ?? "User"}
                </span>
                <span className="dropdown-user-email">{user?.email ?? ""}</span>
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={handleViewProfile}
              >
                <UserIcon />
                <span>View Profile</span>
              </button>
              <button
                className="dropdown-item"
                onClick={handleSettings}
              >
                <SettingsIcon />
                <span>Settings</span>
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item dropdown-item-danger"
                onClick={handleLogout}
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
