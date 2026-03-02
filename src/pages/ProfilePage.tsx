import React, { useContext } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import "./ProfilePage.css";

const ChevronLeftIcon = () => (
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
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ProfilePage: React.FC = () => {
  const history = useHistory();
  const { theme } = useContext(ThemeContext);
  const { user, logout } = useAuth();

  const isDark = theme === "dark";
  const initials = getInitials(user?.name ?? "");

  const handleLogout = () => {
    logout();
    history.push("/login");
  };

  return (
    <IonPage>
      <IonContent color={`background-${theme}`}>
        <div className={`profile-page ${isDark ? "dark" : "light"}`}>
          <div className="profile-header">
            <button
              className="profile-back-btn"
              onClick={() => history.goBack()}
              aria-label="Go back"
            >
              <ChevronLeftIcon />
            </button>
            <h1 className="profile-title">Profile</h1>
            <div style={{ width: 36 }} />
          </div>

          <section className="profile-card profile-main-card">
            <div className="profile-avatar">{initials}</div>
            <h2 className="profile-name">{user?.name ?? "User"}</h2>
            <p className="profile-email">{user?.email ?? ""}</p>
          </section>

          <section className="profile-card">
            <h3 className="profile-section-title">Account</h3>
            <div className="profile-row">
              <span className="profile-label">Name</span>
              <span className="profile-value">{user?.name ?? "-"}</span>
            </div>
            <div className="profile-divider" />
            <div className="profile-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{user?.email ?? "-"}</span>
            </div>
            <div className="profile-divider" />
            <div className="profile-row">
              <span className="profile-label">Status</span>
              <span className="profile-value">{user?.userState ?? "-"}</span>
            </div>
          </section>

          <section className="profile-card">
            <h3 className="profile-section-title">Cycle Profile</h3>
            <div className="profile-row">
              <span className="profile-label">Cycle Length</span>
              <span className="profile-value">
                {user?.cycleProfile?.cycleLength ?? "-"}
              </span>
            </div>
            <div className="profile-divider" />
            <div className="profile-row">
              <span className="profile-label">Period Length</span>
              <span className="profile-value">
                {user?.cycleProfile?.periodLength ?? "-"}
              </span>
            </div>
          </section>

          <section className="profile-card">
            <h3 className="profile-section-title">Actions</h3>
            <button
              className="profile-action-btn"
              onClick={() => history.push("/settings")}
            >
              Open Settings
            </button>
            <button
              className="profile-action-btn danger"
              onClick={handleLogout}
            >
              Logout
            </button>
          </section>

          <div style={{ height: 40 }} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
