import { useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
  IonHeader,
  IonContent,
  IonMenuButton,
  IonIcon,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { menuOutline } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import TabHome from "./pages/TabHome";
import TabDetails from "./pages/TabDetails";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CycleSetupPage from "./pages/CycleSetupPage";
import { useAuth } from "./state/AuthContext";
import "./App.css";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";

import { storage } from "./data/Storage";

import type { Cycle } from "./data/ICycle";
import { getMaxStoredCountOfCycles } from "./state/CalculationLogics";
import { CyclesContext, ThemeContext, SettingsContext } from "./state/Context";
import { Menu } from "./modals/Menu";
import { isNewVersionAvailable } from "./data/AppVersion";
import { configuration } from "./data/AppConfiguration";

import {
  requestPermission,
  clearAllDeliveredNotifications,
  removePendingNotifications,
  createNotifications,
} from "./utils/notifications";

setupIonicReact({
  mode: "md",
});

const Badge = () => {
  const theme = useContext(ThemeContext).theme;
  // NOTE: Ionic's badge can't be empty and need some text in it,
  //       that's why I decided to write my own badge component
  return (
    <div
      style={{
        position: "fixed",
        left: 42,
        top: 0,
        backgroundColor: `var(--ion-color-opposite-${theme})`,
        minWidth: 10,
        minHeight: 10,
        borderRadius: 10,
        marginTop: "env(safe-area-inset-top)",
      }}
    />
  );
};

interface AppProps {
  theme?: string;
}

const App = (props: AppProps) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [theme, setTheme] = useState(props.theme ?? "basic");

  const { t, i18n } = useTranslation();
  const [needUpdate, setNeedUpdate] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [maxNumberOfDisplayedCycles, setMaxNumberOfDisplayedCycles] =
    useState(6);
  const [appMode, setAppMode] = useState("regular");

  const changeLanguage = useCallback(
    (lng: string) => {
      i18n.changeLanguage(lng).catch((err) => console.error(err));
    },
    [i18n],
  );

  const updateCycles = useCallback(
    async (newCycles: Cycle[]) => {
      try {
        const slicedCycles = newCycles.slice(
          0,
          getMaxStoredCountOfCycles(maxNumberOfDisplayedCycles),
        );
        setCycles(slicedCycles);
        await storage.set.cycles(slicedCycles);

        if (configuration.features.notifications && notificationEnabled) {
          await updateNotifications(newCycles, maxNumberOfDisplayedCycles);
        }
      } catch (err) {
        console.error("Error updating cycles", err);
      }
    },
    [maxNumberOfDisplayedCycles, notificationEnabled],
  );

  const updateTheme = useCallback((newTheme: string) => {
    if (newTheme === "light") {
      newTheme = "basic";
    }
    setTheme(newTheme);
    storage.set.theme(newTheme).catch((err) => console.error(err));
    document.body.classList.remove("basic", "dark");
    document.body.classList.add(newTheme);
    document.body.style.background =
      newTheme === "basic" ? "#eae7ff" : "#1f1f1f";
    const metaStatusBarColorAndroid = document.querySelector(
      "meta[name=theme-color]",
    );
    if (metaStatusBarColorAndroid) {
      metaStatusBarColorAndroid.setAttribute(
        "content",
        newTheme === "basic" ? "#eae7ff" : "#1f1f1f",
      );
    }
    const metaStatusBarColorIOS = document.querySelector(
      "meta[name=apple-mobile-web-app-status-bar-style]",
    );
    if (metaStatusBarColorIOS) {
      metaStatusBarColorIOS.setAttribute(
        "content",
        newTheme === "basic" ? "default" : "black",
      );
    }
  }, []);

  const updateNotifications = async (
    cycles: Cycle[],
    maxDisplayedCycles: number,
  ) => {
    await clearAllDeliveredNotifications();
    await removePendingNotifications();
    await createNotifications(cycles, maxDisplayedCycles);
  };

  const updateNotificationsStatus = useCallback(
    async (newStatus: boolean) => {
      try {
        setNotificationEnabled(newStatus);
        await storage.set.isNotificationEnabled(newStatus);
        console.log(
          `Notification has been switched to ${newStatus ? "on" : "off"}`,
        );

        if (newStatus) {
          await createNotifications(cycles, maxNumberOfDisplayedCycles);
        } else {
          await removePendingNotifications();
        }
      } catch (err) {
        console.error("Error updating notification status", err);
      }
    },
    [cycles, maxNumberOfDisplayedCycles],
  );

  const updateMaxNumberOfDisplayedCycles = useCallback(
    async (newValue: number) => {
      try {
        setMaxNumberOfDisplayedCycles(newValue);
        await storage.set.maxNumberOfDisplayedCycles(newValue);
        console.log(`maxDisplayedCycles has been switched to ${newValue}`);
      } catch (err) {
        console.error(err);
      }
    },
    [],
  );

  const updateAppMode = useCallback(async (newMode: string) => {
    try {
      setAppMode(newMode);
      await storage.set.appMode(newMode);
      console.log(`App mode has been switched to ${newMode}`);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!configuration.features.useCustomVersionUpdate) {
      return;
    }

    isNewVersionAvailable()
      .then((newVersionAvailable) => {
        if (!newVersionAvailable) {
          return;
        }
        setNeedUpdate(true);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    storage.get
      .cycles()
      .then(setCycles)
      .catch((err) =>
        console.error(`Can't get cycles ${(err as Error).message}`),
      );

    storage.get
      .language()
      .then((res) => {
        changeLanguage(res);
      })
      .catch((err) =>
        console.error(`Can't get language ${(err as Error).message}`),
      );

    storage.get
      .theme()
      .then((savedTheme) => {
        setTheme(savedTheme);
        document.body.classList.remove("basic", "dark");
        document.body.classList.add(savedTheme);
        document.body.style.background =
          savedTheme === "dark" ? "#1f1f1f" : "#eae7ff";
      })
      .catch((err) => {
        console.error(`Can't get theme ${(err as Error).message}`);
        storage.set.theme(theme).catch((err) => console.error(err));
      });

    storage.get
      .isNotificationEnabled()
      .then(setNotificationEnabled)
      .catch((err) => {
        console.error(
          `Can't get notifications status ${(err as Error).message}`,
        );
        // Notifications are off by default
        storage.set
          .isNotificationEnabled(false)
          .catch((err) => console.error(err));
      });

    storage.get.lastNotificationId().catch((err) => {
      console.error(`Can't get lastNotificationId ${(err as Error).message}`);
      storage.set.lastNotificationId(0).catch((err) => console.error(err));
    });

    storage.get
      .maxNumberOfDisplayedCycles()
      .then(setMaxNumberOfDisplayedCycles)
      .catch((err) => {
        console.error(`Can't get maxDisplayedCycles ${(err as Error).message}`);
        storage.set
          .maxNumberOfDisplayedCycles(maxNumberOfDisplayedCycles)
          .catch((err) => console.error(err));
      });

    storage.get
      .appMode()
      .then(setAppMode)
      .catch((err) => {
        console.error(`Can't get appMode ${(err as Error).message}`);
        storage.set.appMode("regular").catch((err) => console.error(err));
      });
  }, [changeLanguage, theme, maxNumberOfDisplayedCycles]);

  useEffect(() => {
    if (!configuration.features.notifications || !notificationEnabled) {
      return;
    }

    requestPermission().catch((err) => {
      console.error("Error request permission notifications", err);
    });
  }, [notificationEnabled]);

  // NOTE: Refresh notifications every time user open the app
  useEffect(() => {
    if (
      !notificationEnabled ||
      cycles.length === 0 ||
      !configuration.features.notifications
    ) {
      return;
    }

    updateNotifications(cycles, maxNumberOfDisplayedCycles).catch((err) => {
      console.error("Error update notifications", err);
    });
  }, [notificationEnabled, cycles, maxNumberOfDisplayedCycles]);

  const { user, isLoading: authLoading } = useAuth();

  // While checking auth state, show a simple loading spinner
  if (authLoading) {
    return <div className={`auth-spinner ${theme === "dark" ? "dark" : ""}`} />;
  }

  return (
    <CyclesContext.Provider
      value={{
        cycles,
        updateCycles: (newCycles) => {
          updateCycles(newCycles).catch((err) => console.error(err));
        },
      }}
    >
      <ThemeContext.Provider value={{ theme, updateTheme }}>
        <SettingsContext.Provider
          value={{
            notificationEnabled,
            updateNotificationEnabled: (newStatus) => {
              updateNotificationsStatus(newStatus).catch((err) =>
                console.error(err),
              );
            },
            maxNumberOfDisplayedCycles,
            updateMaxNumberOfDisplayedCycles: (newValue) => {
              updateMaxNumberOfDisplayedCycles(newValue).catch((err) =>
                console.error(err),
              );
            },
            appMode,
            updateAppMode: (newMode) => {
              updateAppMode(newMode).catch((err) => console.error(err));
            },
          }}
        >
          <IonApp>
            {/* Floating Bubbles Background - rendered via portal to bypass Ionic stacking contexts */}
            {createPortal(
              <div className="floating-bubbles">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`bubble ${theme}`}
                  />
                ))}
              </div>,
              document.body,
            )}

            <Menu contentId="main-content" />
            <IonReactRouter>
              {/* ── Auth routes (no tabs / header) ── */}
              <Route
                exact
                path="/login"
              >
                {user ? (
                  <Redirect
                    to={user.isOnboarded ? "/OVIFLOW/" : "/cycle-setup"}
                  />
                ) : (
                  <LoginPage />
                )}
              </Route>
              <Route
                exact
                path="/register"
              >
                {user ? (
                  <Redirect
                    to={user.isOnboarded ? "/OVIFLOW/" : "/cycle-setup"}
                  />
                ) : (
                  <RegisterPage />
                )}
              </Route>
              <Route
                exact
                path="/cycle-setup"
              >
                {!user ? <Redirect to="/login" /> : <CycleSetupPage />}
              </Route>

              <IonHeader
                class="ion-no-border"
                style={{
                  backgroundColor: `var(--ion-color-background-${theme})`,
                  height: 0,
                  minHeight: 0,
                }}
              >
                <div
                  id="top-space"
                  className={theme}
                  style={{
                    background: `var(--ion-color-transparent-${theme})`,
                    height: 0,
                  }}
                />
              </IonHeader>

              <IonContent
                id="main-content"
                color={`background-${theme}`}
              >
                <IonTabs>
                  <IonRouterOutlet>
                    <Route
                      exact
                      path="/OVIFLOW/"
                    >
                      {!user ? (
                        <Redirect to="/login" />
                      ) : !user.isOnboarded ? (
                        <Redirect to="/cycle-setup" />
                      ) : (
                        <TabHome />
                      )}
                    </Route>

                    <Route
                      exact
                      path="/OVIFLOW-details/"
                    >
                      {!user ? <Redirect to="/login" /> : <TabDetails />}
                    </Route>

                    <Route
                      exact
                      path="/"
                    >
                      {!user ? (
                        <Redirect to="/login" />
                      ) : !user.isOnboarded ? (
                        <Redirect to="/cycle-setup" />
                      ) : (
                        <Redirect to="/OVIFLOW/" />
                      )}
                    </Route>

                    <Route
                      exact
                      path="/peri/"
                    >
                      <Redirect to="/OVIFLOW/" />
                    </Route>

                    <Route
                      exact
                      path="/peri-details/"
                    >
                      <Redirect to="/OVIFLOW-details/" />
                    </Route>
                  </IonRouterOutlet>

                  <IonTabBar
                    className={theme}
                    slot="top"
                    color={`transparent-${theme}`}
                    style={{ position: "relative" }}
                  >
                    <IonTabButton
                      tab="menu"
                      href="#"
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: `var(--ion-color-transparent-${theme})`,
                        border: `var(--ion-color-transparent-${theme})`,
                        maxWidth: "30px",
                        zIndex: 10,
                      }}
                    >
                      <IonMenuButton>
                        <IonIcon
                          color={`dark-${theme}`}
                          icon={menuOutline}
                          size="large"
                        />
                        {needUpdate && <Badge />}
                      </IonMenuButton>
                    </IonTabButton>

                    <IonTabButton
                      tab="home"
                      href="/OVIFLOW/"
                      className={theme}
                    >
                      <IonLabel>{t("Home")}</IonLabel>
                    </IonTabButton>
                    <IonTabButton
                      tab="details"
                      href="/OVIFLOW-details/"
                      className={theme}
                      style={{ marginLeft: "15px" }}
                    >
                      <IonLabel>{t("Details")}</IonLabel>
                    </IonTabButton>
                  </IonTabBar>
                </IonTabs>
              </IonContent>
            </IonReactRouter>
          </IonApp>
        </SettingsContext.Provider>
      </ThemeContext.Provider>
    </CyclesContext.Provider>
  );
};

export default App;
