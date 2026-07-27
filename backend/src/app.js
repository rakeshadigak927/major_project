const express = require("express");
const cors = require("cors");

const graphRoutes = require("./routes/graphRoutes");
const metamaskRoutes = require("./routes/metamaskRoutes");

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ],
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
        ]
    })
);


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

app.get(
    "/",
    (req, res) => {

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

    }
);


// =====================================================
// API ROUTES
// =====================================================


// -----------------------------------------------------
// Existing Knowledge Graph routes
//
// /api/graph/students
// /api/graph/evolution-history
// /api/graph/verify/:updateId
// etc.
// -----------------------------------------------------

app.use(
    "/api/graph",
    graphRoutes
);


// -----------------------------------------------------
// MetaMask routes
//
// POST /api/graph/metamask/prepare
// POST /api/graph/metamask/confirm
// -----------------------------------------------------

app.use(
    "/api/graph/metamask",
    metamaskRoutes
);


// =====================================================
// API INFORMATION
// =====================================================

app.get(
    "/api",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Decentralized Knowledge Graph API",

            endpoints: {

                graph:
                    "/api/graph",

                metamaskPrepare:
                    "/api/graph/metamask/prepare",

                metamaskConfirm:
                    "/api/graph/metamask/confirm"

            }

        });

    }
);


// =====================================================
// 404 HANDLER
// =====================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API endpoint not found",

            method:
                req.method,

            path:
                req.originalUrl

        });

    }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
    (error, req, res, next) => {

        console.error("");
        console.error(
            "======================================"
        );

        console.error(
            " SERVER ERROR"
        );

        console.error(
            "======================================"
        );

        console.error(error);

        console.error(
            "======================================"
        );

        console.error("");


        res.status(
            error.status || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Internal server error",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.stack
                    : undefined

        });

    }
);


module.exports = app;