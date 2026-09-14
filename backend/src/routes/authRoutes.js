const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    handleGoogleAuth,
    generatePasskeyRegisterOptions,
    verifyPasskeyRegister,
    generatePasskeyLoginOptions,
    verifyPasskeyLogin,
    verifyToken,
    findUserById
} = require("../services/authService");

// Middleware to authenticate JWT token
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Authorization token missing." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication session." });
    }

    const user = await findUserById(decoded.id);
    req.user = user || decoded;
    next();
}

// -----------------------------------------------------
// Register with Email & Password
// -----------------------------------------------------
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required." });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
        }

        const result = await registerUser({ name, email, password });
        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            data: result
        });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// -----------------------------------------------------
// Login with Email & Password
// -----------------------------------------------------
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        const result = await loginUser({ email, password });
        return res.status(200).json({
            success: true,
            message: "Signed in successfully.",
            data: result
        });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// -----------------------------------------------------
// Google OAuth & One Tap Sign-In
// -----------------------------------------------------
router.post("/google", async (req, res) => {
    try {
        const { credential, googleId, email, name } = req.body;
        const result = await handleGoogleAuth({ credential, googleId, email, name });
        return res.status(200).json({
            success: true,
            message: "Google authentication successful.",
            data: result
        });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// -----------------------------------------------------
// Passkey (WebAuthn) Register Options
// -----------------------------------------------------
router.post("/passkey/register-options", authMiddleware, (req, res) => {
    try {
        const options = generatePasskeyRegisterOptions(req.user);
        return res.status(200).json({ success: true, data: options });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// -----------------------------------------------------
// Passkey (WebAuthn) Register Verify
// -----------------------------------------------------
router.post("/passkey/register-verify", authMiddleware, async (req, res) => {
    try {
        const { credential } = req.body;
        const result = await verifyPasskeyRegister(req.user, credential);
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// -----------------------------------------------------
// Passkey (WebAuthn) Login Options
// -----------------------------------------------------
router.post("/passkey/login-options", (req, res) => {
    try {
        const { email } = req.body;
        const options = generatePasskeyLoginOptions(email);
        return res.status(200).json({ success: true, data: options });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// -----------------------------------------------------
// Passkey (WebAuthn) Login Verify
// -----------------------------------------------------
router.post("/passkey/login-verify", async (req, res) => {
    try {
        const { credential } = req.body;
        const result = await verifyPasskeyLogin(credential);
        return res.status(200).json({
            success: true,
            message: "Passkey authentication successful.",
            data: result
        });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// -----------------------------------------------------
// Get Current Authenticated User Profile (/api/auth/me)
// -----------------------------------------------------
router.get("/me", authMiddleware, (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            provider: req.user.provider
        }
    });
});

module.exports = router;

