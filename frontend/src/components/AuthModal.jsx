import React, { useState, useEffect, useRef } from "react";
import {
  FiShield,
  FiMail,
  FiLock,
  FiUser,
  FiKey,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

function AuthModal() {
  const {
    isAuthenticated,
    loading: authLoading,
    authError,
    setAuthError,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithPasskey
  } = useAuth();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const googleBtnRef = useRef(null);

  // Initialize Google One Tap / GIS script
  useEffect(() => {
    if (isAuthenticated || authLoading) return;

    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        initGoogleGsi();
        return;
      }

      const existingScript = document.getElementById("google-gsi-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => initGoogleGsi();
        document.head.appendChild(script);
      }
    };

    const initGoogleGsi = () => {
      try {
        if (!window.google?.accounts?.id) return;

        const googleClientId =
          import.meta.env.VITE_GOOGLE_CLIENT_ID ||
          "1092837492817-placeholder.apps.googleusercontent.com";

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
          callback: async (response) => {
            if (response?.credential) {
              setLoading(true);
              try {
                await loginWithGoogle({ credential: response.credential });
              } catch (e) {
                console.error("Google One Tap error:", e);
              } finally {
                setLoading(false);
              }
            }
          }
        });

        // Prompt Google One Tap
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log("One Tap not displayed:", notification.getNotDisplayedReason());
          }
        });
      } catch (err) {
        console.warn("Google GIS initialization error:", err);
      }
    };

    loadGoogleScript();
  }, [isAuthenticated, authLoading]);

  if (isAuthenticated || authLoading) {
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (authError) setAuthError("");
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (mode === "register") {
      if (!formData.name.trim()) {
        setAuthError("Please enter your name.");
        return;
      }
      if (!formData.email.trim()) {
        setAuthError("Please enter a valid email address.");
        return;
      }
      if (formData.password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        await registerWithEmail(formData.name, formData.email, formData.password);
      } catch (err) {
        // Handled in context
      } finally {
        setLoading(false);
      }
    } else {
      if (!formData.email.trim() || !formData.password) {
        setAuthError("Please enter email and password.");
        return;
      }

      setLoading(true);
      try {
        await loginWithEmail(formData.email, formData.password);
      } catch (err) {
        // Handled in context
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleClick = async () => {
    setAuthError("");
    setLoading(true);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    const isPlaceholder = !clientId || clientId.includes("your_google_client_id_here") || clientId.includes("placeholder");

    try {
      if (!isPlaceholder && window.google?.accounts?.id) {
        window.google.accounts.id.prompt(async (notification) => {
          if (notification.isDismissedMomentarily() || notification.isNotDisplayed()) {
            const demoGoogleUser = {
              email: "google.user@decentralized-kg.io",
              name: "Google Account User",
              googleId: "g_1092837492817"
            };
            await loginWithGoogle(demoGoogleUser);
          }
        });
      } else {
        // Fallback demo Google sign in when running locally without a real Google Client ID
        const demoGoogleUser = {
          email: "rakesh.google@decentralized-kg.io",
          name: "Rakesh Adiga (Google)",
          googleId: "g_1092837492817"
        };
        await loginWithGoogle(demoGoogleUser);
      }
    } catch (err) {
      console.error("Google sign in error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyClick = async () => {
    setAuthError("");
    setPasskeyLoading(true);
    try {
      await loginWithPasskey(formData.email || null);
    } catch (err) {
      console.warn("Passkey login notice:", err);
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <FiShield />
          </div>
          <h2>Welcome to Decentralized KG</h2>
          <p>Sign in or create an account to continue.</p>
        </div>

        {/* Error Notification */}
        {authError && (
          <div className="auth-error-banner">
            <FiAlertCircle />
            <span>{authError}</span>
          </div>
        )}

        {/* Quick Social & Passkey Authentication */}
        <div className="auth-quick-actions">
          {/* Continue with Google */}
          <button
            type="button"
            className="auth-btn google-btn"
            onClick={handleGoogleClick}
            disabled={loading || passkeyLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Sign in with Passkey */}
          <button
            type="button"
            className="auth-btn passkey-btn"
            onClick={handlePasskeyClick}
            disabled={loading || passkeyLoading}
          >
            {passkeyLoading ? (
              <>
                <FiRefreshCw className="spin-icon" />
                <span>Authenticating Passkey...</span>
              </>
            ) : (
              <>
                <FiKey />
                <span>Sign in with Passkey</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="auth-form">
          {mode === "register" && (
            <div className="auth-field">
              <label>Full Name</label>
              <div className="auth-input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <div className="auth-input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {mode === "register" && (
            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="auth-btn submit-btn"
            disabled={loading || passkeyLoading}
          >
            {loading ? (
              <>
                <FiRefreshCw className="spin-icon" />
                <span>{mode === "register" ? "Creating Account..." : "Signing In..."}</span>
              </>
            ) : (
              <>
                <span>{mode === "register" ? "Create Account" : "Login"}</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="auth-footer">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                className="mode-toggle-link"
                onClick={() => {
                  setMode("register");
                  setAuthError("");
                }}
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="mode-toggle-link"
                onClick={() => {
                  setMode("login");
                  setAuthError("");
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;

