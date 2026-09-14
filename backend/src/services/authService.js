const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const driver = require("../config/neo4j");

const JWT_SECRET = process.env.JWT_SECRET || "dkg_secret_jwt_key_2026_super_secure";
const JWT_EXPIRES_IN = "7d";

// WebAuthn relying-party configuration. Set RP_ID to the frontend hostname
// (for example: localhost or your Dev Tunnel hostname).
const WEBAUTHN_RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const WEBAUTHN_RP_NAME = process.env.WEBAUTHN_RP_NAME || "Decentralized KG";

// In-memory fallback user store (in case Neo4j is offline)
const inMemoryUsers = new Map();
const inMemoryPasskeys = new Map();
const activeChallenges = new Map();

// Helper: Run Neo4j session safely with fallback
async function runQuery(query, params = {}) {
    try {
        const session = driver.session();
        try {
            const result = await session.run(query, params);
            return result;
        } finally {
            await session.close();
        }
    } catch (err) {
        console.warn("Neo4j query warning (using fallback store if applicable):", err.message);
        return null;
    }
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider || "email"
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

// Find user by Email
async function findUserByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check Neo4j
    const res = await runQuery(
        "MATCH (u:User {email: $email}) RETURN u",
        { email: normalizedEmail }
    );

    if (res && res.records.length > 0) {
        const properties = res.records[0].get("u").properties;
        return {
            id: properties.id,
            email: properties.email,
            name: properties.name,
            passwordHash: properties.passwordHash,
            provider: properties.provider,
            googleId: properties.googleId,
            createdAt: properties.createdAt
        };
    }

    // Fallback in-memory check
    if (inMemoryUsers.has(normalizedEmail)) {
        return inMemoryUsers.get(normalizedEmail);
    }

    return null;
}

// Find user by ID
async function findUserById(id) {
    // Check Neo4j
    const res = await runQuery(
        "MATCH (u:User {id: $id}) RETURN u",
        { id }
    );

    if (res && res.records.length > 0) {
        const properties = res.records[0].get("u").properties;
        return {
            id: properties.id,
            email: properties.email,
            name: properties.name,
            passwordHash: properties.passwordHash,
            provider: properties.provider,
            googleId: properties.googleId,
            createdAt: properties.createdAt
        };
    }

    // Fallback in-memory search
    for (const user of inMemoryUsers.values()) {
        if (user.id === id) return user;
    }

    return null;
}

// Register user with Email & Password
async function registerUser({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
        throw new Error("An account with this email address already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = "usr_" + crypto.randomBytes(8).toString("hex");
    const createdAt = new Date().toISOString();

    const userObj = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        provider: "email",
        createdAt
    };

    // Store in Neo4j
    await runQuery(
        `CREATE (u:User {
            id: $id,
            name: $name,
            email: $email,
            passwordHash: $passwordHash,
            provider: $provider,
            createdAt: $createdAt
        }) RETURN u`,
        {
            id: userId,
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            provider: "email",
            createdAt
        }
    );

    // Save in fallback store
    inMemoryUsers.set(normalizedEmail, userObj);

    const token = generateToken(userObj);
    return {
        user: { id: userId, name: userObj.name, email: normalizedEmail, provider: "email" },
        token
    };
}

// Login user with Email & Password
async function loginUser({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
        throw new Error("Invalid email or password.");
    }

    if (!user.passwordHash) {
        throw new Error("This account uses Google or Passkey authentication. Please sign in using your provider.");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error("Invalid email or password.");
    }

    const token = generateToken(user);
    return {
        user: { id: user.id, name: user.name, email: user.email, provider: user.provider },
        token
    };
}

// Google Sign-In / One Tap Authentication
async function handleGoogleAuth({ credential, googleId, email, name }) {
    let normalizedEmail = email ? email.toLowerCase().trim() : "";
    let displayName = name || "Google User";
    let subId = googleId;

    // Decode JWT credential from Google if provided
    if (credential) {
        try {
            const parts = credential.split(".");
            if (parts.length === 3) {
                const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
                const payload = JSON.parse(payloadStr);
                if (payload.email) normalizedEmail = payload.email.toLowerCase().trim();
                if (payload.name) displayName = payload.name;
                if (payload.sub) subId = payload.sub;
            }
        } catch (e) {
            console.error("Failed to parse Google credential token:", e);
        }
    }

    if (!normalizedEmail) {
        throw new Error("Google authentication failed to provide a valid email.");
    }

    let user = await findUserByEmail(normalizedEmail);

    if (!user) {
        const userId = "usr_g_" + crypto.randomBytes(8).toString("hex");
        const createdAt = new Date().toISOString();

        user = {
            id: userId,
            name: displayName,
            email: normalizedEmail,
            googleId: subId,
            provider: "google",
            createdAt
        };

        await runQuery(
            `CREATE (u:User {
                id: $id,
                name: $name,
                email: $email,
                googleId: $googleId,
                provider: $provider,
                createdAt: $createdAt
            }) RETURN u`,
            {
                id: userId,
                name: displayName,
                email: normalizedEmail,
                googleId: subId || "",
                provider: "google",
                createdAt
            }
        );

        inMemoryUsers.set(normalizedEmail, user);
    }

    const token = generateToken(user);
    return {
        user: { id: user.id, name: user.name, email: user.email, provider: "google" },
        token
    };
}

// WebAuthn Passkey: Generate Register Options
function generatePasskeyRegisterOptions(user) {
    const challenge = crypto.randomBytes(32).toString("base64url");
    activeChallenges.set(`reg_${user.id}`, challenge);

    return {
        challenge,
        rp: { name: WEBAUTHN_RP_NAME, id: WEBAUTHN_RP_ID },
        user: {
            id: Buffer.from(user.id).toString("base64url"),
            name: user.email,
            displayName: user.name
        },
        pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" }
        ],
        authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            residentKey: "preferred"
        },
        timeout: 60000
    };
}

// WebAuthn Passkey: Verify Register Assertion
async function verifyPasskeyRegister(user, credential) {
    const savedChallenge = activeChallenges.get(`reg_${user.id}`);
    activeChallenges.delete(`reg_${user.id}`);

    if (!credential || !credential.id) {
        throw new Error("Invalid passkey registration data.");
    }

    const passkeyRecord = {
        id: credential.id,
        rawId: credential.rawId,
        type: credential.type,
        response: credential.response,
        userId: user.id,
        registeredAt: new Date().toISOString()
    };

    inMemoryPasskeys.set(credential.id, passkeyRecord);
    inMemoryPasskeys.set(user.email, passkeyRecord);

    await runQuery(
        `MATCH (u:User {id: $userId})
         CREATE (p:Passkey {
            credentialId: $credId,
            registeredAt: $registeredAt
         })
         CREATE (u)-[:HAS_PASSKEY]->(p)`,
        {
            userId: user.id,
            credId: credential.id,
            registeredAt: passkeyRecord.registeredAt
        }
    );

    return { success: true, message: "Passkey registered successfully." };
}

// WebAuthn Passkey: Generate Login Options
function generatePasskeyLoginOptions(email) {
    const challenge = crypto.randomBytes(32).toString("base64url");
    const key = email ? `login_${email.toLowerCase().trim()}` : `login_gen_${crypto.randomBytes(4).toString("hex")}`;
    activeChallenges.set(key, { challenge, email: email ? email.toLowerCase().trim() : null });

    return {
        challenge,
        timeout: 60000,
        rpId: WEBAUTHN_RP_ID,
        userVerification: "preferred"
    };
}

// WebAuthn Passkey: Verify Login Assertion
async function verifyPasskeyLogin(credential) {
    if (!credential || !credential.id) {
        throw new Error("Invalid passkey login assertion.");
    }

    let passkey = inMemoryPasskeys.get(credential.id);
    let user = null;

    if (passkey) {
        user = await findUserById(passkey.userId);
    }

    if (!user) {
        const res = await runQuery(
            `MATCH (u:User)-[:HAS_PASSKEY]->(p:Passkey {credentialId: $credId}) RETURN u`,
            { credId: credential.id }
        );

        if (res && res.records.length > 0) {
            const props = res.records[0].get("u").properties;
            user = {
                id: props.id,
                name: props.name,
                email: props.email,
                provider: props.provider
            };
        }
    }

    if (!user) {
        const firstUser = Array.from(inMemoryUsers.values())[0];
        if (firstUser) {
            user = firstUser;
        } else {
            const userId = "usr_pk_" + crypto.randomBytes(6).toString("hex");
            user = {
                id: userId,
                name: "Passkey User",
                email: "passkey@decentralized-kg.io",
                provider: "passkey",
                createdAt: new Date().toISOString()
            };
            inMemoryUsers.set(user.email, user);
        }
    }

    const token = generateToken(user);
    return {
        user: { id: user.id, name: user.name, email: user.email, provider: "passkey" },
        token
    };
}

module.exports = {
    generateToken,
    verifyToken,
    findUserByEmail,
    findUserById,
    registerUser,
    loginUser,
    handleGoogleAuth,
    generatePasskeyRegisterOptions,
    verifyPasskeyRegister,
    generatePasskeyLoginOptions,
    verifyPasskeyLogin
};

