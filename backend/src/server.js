require("dotenv").config();

const app = require("./app");

const driver = require("./config/neo4j");


const PORT =
    process.env.PORT || 5000;


// =====================================================
// START SERVER
// =====================================================

async function startServer() {

    try {

        // Test Neo4j connection

        await driver.verifyConnectivity();

        console.log(
            "Neo4j connected successfully"
        );


        // Start Express

        const server = app.listen(
            PORT,
            () => {

                console.log(
                    `Server running on port ${PORT}`
                );

                console.log(
                    `API: http://localhost:${PORT}`
                );

            }
        );


        // =================================================
        // GRACEFUL SHUTDOWN
        // =================================================

        const shutdown = async () => {

            console.log(
                "\nShutting down server..."
            );

            server.close(
                async () => {

                    try {

                        await driver.close();

                        console.log(
                            "Neo4j connection closed"
                        );

                    } catch (error) {

                        console.error(
                            "Error closing Neo4j:",
                            error
                        );

                    }

                    process.exit(0);

                }
            );

        };


        process.on(
            "SIGINT",
            shutdown
        );


        process.on(
            "SIGTERM",
            shutdown
        );


    } catch (error) {

        console.error(
            "Failed to connect to Neo4j:"
        );

        console.error(
            error.message
        );

        process.exit(1);

    }

}


startServer();