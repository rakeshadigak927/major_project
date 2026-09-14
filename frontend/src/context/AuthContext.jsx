import React, { createContext, useContext, useState, useEffect } from "react";
import {
  loginWithEmailApi,
  registerWithEmailApi,
  googleAuthApi,
  getPasskeyRegisterOptionsApi,
  verifyPasskeyRegisterApi,
  getPasskeyLoginOptionsApi,
  verifyPasskeyLoginApi,
  getCurrentUserApi,
  getApiErrorMessage
} from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("dkg_auth_token") || "");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Check stored session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("dkg_auth_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await getCurrentUserApi();
        if (res.success && res.user) {
          setUser(res.user);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.warn("Session restore failed:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Save session state
  const handleAuthSuccess = (data) => {
    const sessionToken = data.token;
    const userProfile = data.user;

    localStorage.setItem("dkg_auth_token", sessionToken);
    setToken(sessionToken);
    setUser(userProfile);
    setAuthError("");
  };

  // Login Email
  const loginWithEmail = async (email, password) => {
    try {
      setAuthError("");
      const res = await loginWithEmailApi({ email, password });
      if (res.success && res.data) {
        handleAuthSuccess(res.data);
        return true;
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Register Email
  const registerWithEmail = async (name, email, password) => {
    try {
      setAuthError("");
      const res = await registerWithEmailApi({ name, email, password });
      if (res.success && res.data) {
        handleAuthSuccess(res.data);
        return true;
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Google OAuth / One Tap
  const loginWithGoogle = async (googleResponse) => {
    try {
      setAuthError("");
      const res = await googleAuthApi(googleResponse);
      if (res.success && res.data) {
        handleAuthSuccess(res.data);
        return true;
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Passkey Login via WebAuthn API
  const loginWithPasskey = async (email) => {
    try {
      setAuthError("");
      // Get options
      const optRes = await getPasskeyLoginOptionsApi(email);
      if (!optRes.success || !optRes.data) {
        throw new Error("Failed to initialize WebAuthn passkey session.");
      }

      const options = optRes.data;
      if (!window.PublicKeyCredential) {
        throw new Error("Passkeys are not supported by this browser or device.");
      }

      // Convert challenge base64url string to Uint8Array
      const challengeBuffer = Uint8Array.from(
        atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0)
      );

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBuffer,
          timeout: options.timeout || 60000,
          rpId: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
          userVerification: options.userVerification || "preferred"
        }
      });

      const credObj = {
        id: credential.id,
        rawId: credential.id,
        type: credential.type
      };

      const verifyRes = await verifyPasskeyLoginApi(credObj);
      if (verifyRes.success && verifyRes.data) {
        handleAuthSuccess(verifyRes.data);
        return true;
      }
    } catch (err) {
      const msg = err.name === "NotAllowedError"
        ? "Passkey authentication was cancelled or timed out."
        : (getApiErrorMessage(err) || err.message);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Register Passkey
  const registerPasskey = async () => {
    try {
      setAuthError("");
      if (!window.PublicKeyCredential) {
        throw new Error("Passkeys are not supported by this browser.");
      }

      const optRes = await getPasskeyRegisterOptionsApi();
      if (!optRes.success || !optRes.data) {
        throw new Error("Failed to generate passkey creation options.");
      }

      const options = optRes.data;
      const challengeBuffer = Uint8Array.from(
        atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0)
      );

      const userBuffer = Uint8Array.from(
        atob(options.user.id.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0)
      );

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBuffer,
          rp: options.rp,
          user: {
            id: userBuffer,
            name: options.user.name,
            displayName: options.user.displayName
          },
          pubKeyCredParams: options.pubKeyCredParams,
          timeout: options.timeout,
          authenticatorSelection: options.authenticatorSelection
        }
      });

      const credObj = {
        id: credential.id,
        rawId: credential.id,
        type: credential.type
      };

      const verifyRes = await verifyPasskeyRegisterApi(credObj);
      return verifyRes.success;
    } catch (err) {
      const msg = getApiErrorMessage(err) || err.message;
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("dkg_auth_token");
    setToken("");
    setUser(null);
    setAuthError("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        authError,
        setAuthError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithPasskey,
        registerPasskey,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

