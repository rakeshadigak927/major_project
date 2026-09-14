const express = require("express");
const cors = require("cors");
require("dotenv").config();

const graphRoutes = require("./routes/graphRoutes");
const metamaskRoutes = require("./routes/metamaskRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// =====================================================
// CORS CONFIGURATION
// =====================================================

const configuredOrigins = (process.env.FRONTEND_URLS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

console.log("======================================");
console.log("CORS CONFIGURATION");
console.log("======================================");
console.log("Allowed frontend origins:");
console.log(configuredOrigins);
console.log("======================================");

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without Origin header
            // such as curl/Postman/server-to-server requests.
            if (!origin) {
                return callback(null, true);
            }

            const normalizedOrigin = origin
                .trim()
                .replace(/\/$/, "");

            // Allow all origins if configured as *
            if (configuredOrigins.includes("*")) {
                console.log(
                    "CORS allowed:",
                    normalizedOrigin
                );

                return callback(null, true);
            }

            // Check allowed frontend origins
            if (configuredOrigins.includes(normalizedOrigin)) {
                console.log(
                    "CORS allowed:",
                    normalizedOrigin
                );

                return callback(null, true);
            }

            // Block unknown origin
            console.error("======================================");
            console.error("CORS BLOCKED");
            console.error("Request Origin:", normalizedOrigin);
            console.error(
                "Allowed Origins:",
                configuredOrigins
            );
            console.error("======================================");

            return callback(
                new Error(
                    `CORS blocked origin: ${normalizedOrigin}`
                )
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ],

        credentials: true,

        optionsSuccessStatus: 204
    })
);


// =====================================================
// BODY PARSERS
// =====================================================

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);


// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        project:
            "Decentralized Knowledge Graph Evolution using Blockchain Technology",

        message:
            "Knowledge Graph API is running",

        version:
            "1.0.0",

        blockchain:
            "Ethereum Sepolia",

        walletSigning:
            "MetaMask Enabled"

    });

});


// =====================================================
// KNOWLEDGE GRAPH ROUTES
// =====================================================

// Examples:
//
// GET  /api/graph/stats
// GET  /api/graph/students
// GET  /api/graph/evolution-history
// GET  /api/graph/blockchain/status
// GET  /api/graph/verify/:updateId
//
// etc.

app.use(
    "/api/graph",
    graphRoutes
);


// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/google
// POST /api/auth/passkey/*

app.use(
    "/api/auth",
    authRoutes
);


// =====================================================
// METAMASK ROUTES
// =====================================================

// POST /api/graph/metamask/prepare
// POST /api/graph/metamask/confirm

app.use(
    "/api/graph/metamask",
    metamaskRoutes
);


// =====================================================
// API INFORMATION
// =====================================================

app.get("/api", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "Decentralized Knowledge Graph API",

        endpoints: {

            graph:
                "/api/graph",

            stats:
                "/api/graph/stats",

            students:
                "/api/graph/students",

            evolutionHistory:
                "/api/graph/evolution-history",

            blockchainStatus:
                "/api/graph/blockchain/status",

            metamaskPrepare:
                "/api/graph/metamask/prepare",

            metamaskConfirm:
                "/api/graph/metamask/confirm",

            auth:
                "/api/auth"

        }

    });

});


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API endpoint not found",

        method:
            req.method,

        path:
            req.originalUrl

    });

});


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {

    console.error("");
    console.error("======================================");
    console.error("SERVER ERROR");
    console.error("======================================");
    console.error(error);
    console.error("======================================");
    console.error("");

    // CORS error
    if (
        error.message &&
        error.message.startsWith(
            "CORS blocked origin:"
        )
    ) {

        return res.status(403).json({

            success: false,

            message:
                error.message

        });
    }

    // Other server errors
    res.status(
        error.status || 500
    ).json({

        success: false,

        message:
            error.message ||
            "Internal server error",

        error:
            process.env.NODE_ENV === "development"
                ? error.stack
                : undefined

    });

});


// =====================================================
// EXPORT APP
// =====================================================

module.exports = app;