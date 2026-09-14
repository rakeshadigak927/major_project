const express = require("express");
const driver = require("../config/neo4j");

const {
    submitGraphUpdate,
    verifyGraphUpdate,
    getBlockchainUpdate,
    getBlockchainUpdateCount
} = require("../services/blockchainService");


const router = express.Router();


// =====================================================
// HELPER
// =====================================================

function neo4jNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }


    if (
        typeof value.toNumber === "function"
    ) {
        return value.toNumber();
    }


    return value;
}


// =====================================================
// 1. GET ALL STUDENTS
// =====================================================

router.get(
    "/students",
    async (req, res) => {

        const session =
            driver.session();


        try {

            const result =
                await session.run(`
                    MATCH (s:Student)

                    RETURN
                        s.studentId AS studentId,
                        s.name AS name,
                        s.semester AS semester

                    ORDER BY
                        s.studentId
                `);


            const students =
                result.records.map(
                    record => ({

                        studentId:
                            record.get(
                                "studentId"
                            ),

                        name:
                            record.get(
                                "name"
                            ),

                        semester:
                            neo4jNumber(
                                record.get(
                                    "semester"
                                )
                            )

                    })
                );


            res.status(200).json({

                success: true,

                count:
                    students.length,

                data:
                    students

            });


        } catch (error) {

            console.error(
                "GET STUDENTS ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve students"

            });


        } finally {

            await session.close();

        }

    }
);


// =====================================================
// 2. GET ONE STUDENT + KNOWLEDGE
// =====================================================

router.get(
    "/students/:studentId",
    async (req, res) => {

        const {
            studentId
        } = req.params;


        const session =
            driver.session();


        try {

            const result =
                await session.run(
                    `
                    MATCH (s:Student {
                        studentId: $studentId
                    })

                    OPTIONAL MATCH
                        (s)-[r]->(target)

                    RETURN
                        s,

                        collect(
                            CASE

                                WHEN r IS NULL
                                THEN null

                                ELSE {

                                    relationship:
                                        type(r),

                                    relationshipProperties:
                                        properties(r),

                                    targetLabels:
                                        labels(target),

                                    target:
                                        properties(target)

                                }

                            END
                        ) AS knowledge
                    `,
                    {
                        studentId
                    }
                );


            if (
                result.records.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student not found"

                });

            }


            const record =
                result.records[0];


            const student =
                record
                    .get("s")
                    .properties;


            const knowledge =
                record
                    .get("knowledge")
                    .filter(
                        item =>
                            item !== null
                    );


            res.status(200).json({

                success: true,

                data: {

                    student,

                    knowledge

                }

            });


        } catch (error) {

            console.error(
                "GET STUDENT ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve student"

            });


        } finally {

            await session.close();

        }

    }
);


// =====================================================
// 3. LEGACY ADD KNOWLEDGE
//
// IMPORTANT:
//
// This endpoint uses the BACKEND wallet.
//
// The new frontend MetaMask flow uses:
//
// POST /api/graph/metamask/prepare
// POST /api/graph/metamask/confirm
//
// This endpoint is retained only for compatibility.
// =====================================================

router.post(
    "/add-knowledge",
    async (req, res) => {

        const {

            studentId,

            certificateId,

            certificateName,

            issuer,

            submittedBy

        } = req.body;


        if (
            !studentId ||
            !certificateId ||
            !certificateName ||
            !issuer ||
            !submittedBy
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All fields are required"

            });

        }


        const session =
            driver.session();


        let updateId = null;


        try {

            // =========================================
            // CHECK STUDENT
            // =========================================

            const studentResult =
                await session.run(
                    `
                    MATCH (s:Student {
                        studentId:
                            $studentId
                    })

                    RETURN s
                    `,
                    {
                        studentId
                    }
                );


            if (
                studentResult
                    .records
                    .length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student not found"

                });

            }


            // =========================================
            // DUPLICATE CHECK
            // =========================================

            const duplicateResult =
                await session.run(
                    `
                    MATCH
                        (s:Student {
                            studentId:
                                $studentId
                        })
                        -[:EARNED]->
                        (c:Certificate {
                            certificateId:
                                $certificateId
                        })

                    RETURN c
                    `,
                    {
                        studentId,
                        certificateId
                    }
                );


            if (
                duplicateResult
                    .records
                    .length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This knowledge already exists"

                });

            }


            // =========================================
            // GENERATE UPDATE ID
            // =========================================

            updateId =
                "UPD-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 8)
                    .toUpperCase();


            // =========================================
            // CREATE GRAPH UPDATE
            // =========================================

            await session.executeWrite(
                async tx => {

                    await tx.run(
                        `
                        MATCH (s:Student {
                            studentId:
                                $studentId
                        })


                        MERGE (cert:Certificate {
                            certificateId:
                                $certificateId
                        })

                        ON CREATE SET

                            cert.name =
                                $certificateName,

                            cert.issuer =
                                $issuer,

                            cert.createdAt =
                                datetime()

                        ON MATCH SET

                            cert.name =
                                $certificateName,

                            cert.issuer =
                                $issuer


                        CREATE
                            (s)-[:EARNED {

                                year: 2026,

                                createdAt:
                                    datetime(),

                                updateId:
                                    $updateId

                            }]->(cert)


                        CREATE (u:GraphUpdate {

                            updateId:
                                $updateId,

                            action:
                                "ADD_RELATIONSHIP",

                            entityType:
                                "Student",

                            entityId:
                                $studentId,

                            relationship:
                                "EARNED",

                            targetType:
                                "Certificate",

                            targetId:
                                $certificateId,

                            description:
                                "Student earned a new certificate",

                            status:
                                "PENDING_BLOCKCHAIN",

                            blockchainVerified:
                                false,

                            signingMethod:
                                "BACKEND_WALLET",

                            createdAt:
                                datetime(),

                            timestamp:
                                datetime()

                        })


                        CREATE
                            (u)-[:UPDATED_ENTITY]->(s)


                        CREATE
                            (u)-[:ADDED_ENTITY]->(cert)


                        MERGE (actor:Actor {
                            actorId:
                                $submittedBy
                        })

                        ON CREATE SET

                            actor.name =
                                $submittedBy,

                            actor.role =
                                "AUTHORIZED_PROVIDER",

                            actor.createdAt =
                                datetime()


                        CREATE
                            (u)-[:SUBMITTED_BY]->(actor)
                        `,
                        {

                            studentId,

                            certificateId,

                            certificateName,

                            issuer,

                            submittedBy,

                            updateId

                        }
                    );

                }
            );


            // =========================================
            // BLOCKCHAIN
            // =========================================

            let blockchainResult;


            try {

                blockchainResult =
                    await submitGraphUpdate({

                        updateId,

                        studentId,

                        certificateId,

                        certificateName,

                        issuer,

                        submittedBy

                    });


            } catch (blockchainError) {

                console.error(
                    "BLOCKCHAIN WRITE ERROR:",
                    blockchainError
                );


                await session.run(
                    `
                    MATCH (u:GraphUpdate {
                        updateId:
                            $updateId
                    })

                    SET
                        u.status =
                            "BLOCKCHAIN_FAILED",

                        u.blockchainVerified =
                            false
                    `,
                    {
                        updateId
                    }
                );


                return res.status(502).json({

                    success: false,

                    message:
                        "Knowledge was added to Neo4j but blockchain anchoring failed",

                    updateId,

                    blockchain: {

                        status:
                            "BLOCKCHAIN_FAILED"

                    }

                });

            }


            // =========================================
            // SAVE BLOCKCHAIN PROOF
            // =========================================

            await session.run(
                `
                MATCH (u:GraphUpdate {
                    updateId:
                        $updateId
                })

                SET
                    u.status =
                        "BLOCKCHAIN_VERIFIED",

                    u.blockchainVerified =
                        true,

                    u.dataHash =
                        $dataHash,

                    u.transactionHash =
                        $transactionHash,

                    u.blockNumber =
                        $blockNumber,

                    u.blockchainUpdateId =
                        $blockchainUpdateId,

                    u.signingMethod =
                        "BACKEND_WALLET",

                    u.blockchainConfirmedAt =
                        datetime()
                `,
                {

                    updateId,

                    dataHash:
                        blockchainResult
                            .dataHash,

                    transactionHash:
                        blockchainResult
                            .transactionHash,

                    blockNumber:
                        blockchainResult
                            .blockNumber,

                    blockchainUpdateId:
                        blockchainResult
                            .blockchainUpdateId

                }
            );


            // =========================================
            // SUCCESS
            // =========================================

            res.status(201).json({

                success: true,

                message:
                    "Knowledge added and verified on blockchain",

                data: {

                    updateId,

                    knowledge: {

                        source:
                            studentId,

                        relationship:
                            "EARNED",

                        target:
                            certificateId

                    },

                    certificate: {

                        certificateId,

                        certificateName,

                        issuer

                    },

                    provenance: {

                        submittedBy

                    },

                    blockchain: {

                        status:
                            "BLOCKCHAIN_VERIFIED",

                        verified:
                            true,

                        signingMethod:
                            "BACKEND_WALLET",

                        walletAddress:
                            null,

                        blockchainUpdateId:
                            blockchainResult
                                .blockchainUpdateId,

                        dataHash:
                            blockchainResult
                                .dataHash,

                        transactionHash:
                            blockchainResult
                                .transactionHash,

                        blockNumber:
                            blockchainResult
                                .blockNumber

                    }

                }

            });


        } catch (error) {

            console.error(
                "ADD KNOWLEDGE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to add knowledge",

                updateId,

                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? error.message
                        : undefined

            });


        } finally {

            await session.close();

        }

    }
);


// =====================================================
// 4. EVOLUTION HISTORY
// =====================================================

router.get(
    "/evolution-history",
    async (req, res) => {

        const session =
            driver.session();


        try {

            const result =
                await session.run(`
                    MATCH (u:GraphUpdate)

                    OPTIONAL MATCH
                        (u)-[:SUBMITTED_BY]->
                        (actor:Actor)

                    OPTIONAL MATCH
                        (u)-[:UPDATED_ENTITY]->
                        (source)

                    OPTIONAL MATCH
                        (u)-[:ADDED_ENTITY]->
                        (target)

                    RETURN
                        u,
                        actor,
                        source,
                        target

                    ORDER BY
                        u.timestamp DESC
                `);


            const history =
                result.records.map(
                    record => {

                        const u =
                            record
                                .get("u")
                                .properties;


                        const actor =
                            record.get(
                                "actor"
                            );


                        const source =
                            record.get(
                                "source"
                            );


                        const target =
                            record.get(
                                "target"
                            );


                        return {

                            updateId:
                                u.updateId,

                            action:
                                u.action,

                            description:
                                u.description,

                            source:
                                source
                                    ? source
                                        .properties
                                    : null,

                            relationship:
                                u.relationship,

                            target:
                                target
                                    ? target
                                        .properties
                                    : null,

                            provenance:
                                actor
                                    ? actor
                                        .properties
                                    : null,


                            // =================================
                            // BLOCKCHAIN PROOF
                            // =================================

                            blockchain: {

                                status:
                                    u.status,

                                verified:
                                    u.blockchainVerified
                                    || false,


                                // =============================
                                // NEW — SIGNING INFORMATION
                                // =============================

                                signingMethod:
                                    u.signingMethod
                                    || null,

                                walletAddress:
                                    u.walletAddress
                                    || null,


                                // =============================
                                // BLOCKCHAIN RECORD
                                // =============================

                                blockchainUpdateId:
                                    u.blockchainUpdateId
                                    || null,

                                dataHash:
                                    u.dataHash
                                    || null,

                                transactionHash:
                                    u.transactionHash
                                    || null,

                                blockNumber:
                                    neo4jNumber(
                                        u.blockNumber
                                    ),

                                confirmedAt:
                                    u.blockchainConfirmedAt
                                        ? u
                                            .blockchainConfirmedAt
                                            .toString()
                                        : null

                            },


                            timestamp:
                                u.timestamp
                                    ? u.timestamp
                                        .toString()
                                    : null

                        };

                    }
                );


            res.status(200).json({

                success: true,

                count:
                    history.length,

                data:
                    history

            });


        } catch (error) {

            console.error(
                "EVOLUTION HISTORY ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve evolution history"

            });


        } finally {

            await session.close();

        }

    }
);


// =====================================================
// 5. GET ONE UPDATE
// =====================================================

router.get(
    "/updates/:updateId",
    async (req, res) => {

        const {
            updateId
        } = req.params;


        const session =
            driver.session();


        try {

            const result =
                await session.run(
                    `
                    MATCH (u:GraphUpdate {
                        updateId:
                            $updateId
                    })

                    OPTIONAL MATCH
                        (u)-[:SUBMITTED_BY]->
                        (actor)

                    OPTIONAL MATCH
                        (u)-[:UPDATED_ENTITY]->
                        (source)

                    OPTIONAL MATCH
                        (u)-[:ADDED_ENTITY]->
                        (target)

                    RETURN
                        u,
                        actor,
                        source,
                        target
                    `,
                    {
                        updateId
                    }
                );


            if (
                result.records.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Graph update not found"

                });

            }


            const record =
                result.records[0];


            const update =
                record
                    .get("u")
                    .properties;


            res.status(200).json({

                success: true,

                data: {

                    update: {

                        ...update,

                        blockNumber:
                            neo4jNumber(
                                update.blockNumber
                            )

                    },

                    blockchain: {

                        status:
                            update.status
                            || null,

                        verified:
                            update.blockchainVerified
                            || false,

                        signingMethod:
                            update.signingMethod
                            || null,

                        walletAddress:
                            update.walletAddress
                            || null,

                        blockchainUpdateId:
                            update.blockchainUpdateId
                            || null,

                        dataHash:
                            update.dataHash
                            || null,

                        transactionHash:
                            update.transactionHash
                            || null,

                        blockNumber:
                            neo4jNumber(
                                update.blockNumber
                            )

                    },

                    provenance:
                        record.get("actor")
                            ? record
                                .get("actor")
                                .properties
                            : null,

                    source:
                        record.get("source")
                            ? record
                                .get("source")
                                .properties
                            : null,

                    target:
                        record.get("target")
                            ? record
                                .get("target")
                                .properties
                            : null

                }

            });


        } catch (error) {

            console.error(
                "GET UPDATE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve graph update"

            });


        } finally {

            await session.close();

        }

    }
);


// =====================================================
// 6. VERIFY UPDATE AGAINST BLOCKCHAIN
// =====================================================

router.get(
    "/verify/:updateId",
    async (req, res) => {

        const {
            updateId
        } = req.params;


        const session =
            driver.session();


        try {

            const result =
                await session.run(
                    `
                    MATCH (u:GraphUpdate {
                        updateId:
                            $updateId
                    })

                    RETURN

                        u.dataHash
                            AS dataHash,

                        u.blockchainUpdateId
                            AS blockchainUpdateId,

                        u.transactionHash
                            AS transactionHash,

                        u.status
                            AS status,

                        u.walletAddress
                            AS walletAddress,

                        u.signingMethod
                            AS signingMethod,

                        u.blockNumber
                            AS blockNumber
                    `,
                    {
                        updateId
                    }
                );


            if (
                result.records.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Graph update not found"

                });

            }


            const record =
                result.records[0];


            const dataHash =
                record.get(
                    "dataHash"
                );


            const blockchainUpdateId =
                record.get(
                    "blockchainUpdateId"
                );


            if (
                !dataHash ||
                blockchainUpdateId === null ||
                blockchainUpdateId === undefined
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This update has not been anchored on blockchain",

                    updateId

                });

            }


            const verified =
                await verifyGraphUpdate(
                    blockchainUpdateId,
                    dataHash
                );


            res.status(200).json({

                success: true,

                updateId,

                blockchainUpdateId,

                verified,

                integrity:
                    verified
                        ? "VALID"
                        : "INVALID",

                transactionHash:
                    record.get(
                        "transactionHash"
                    ),

                blockNumber:
                    neo4jNumber(
                        record.get(
                            "blockNumber"
                        )
                    ),

                walletAddress:
                    record.get(
                        "walletAddress"
                    ),

                signingMethod:
                    record.get(
                        "signingMethod"
                    ),

                status:
                    record.get(
                        "status"
                    )

            });


        } catch (error) {

            console.error(
                "VERIFY UPDATE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Blockchain verification failed",

                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? error.message
                        : undefined

            });


        } finally {

            await session.close();

        }

    }
);


// =====================================================
// 7. BLOCKCHAIN STATUS
// =====================================================

router.get(
    "/blockchain/status",
    async (req, res) => {

        try {

            const count =
                await getBlockchainUpdateCount();


            res.status(200).json({

                success: true,

                network:
                    "Ethereum Sepolia",

                chainId:
                    11155111,

                contract:
                    process.env
                        .CONTRACT_ADDRESS,

                totalBlockchainUpdates:
                    count

            });


        } catch (error) {

            console.error(
                "BLOCKCHAIN STATUS ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to read blockchain"

            });

        }

    }
);


// =====================================================
// 8. GET BLOCKCHAIN RECORD
// =====================================================

router.get(
    "/blockchain/updates/:id",
    async (req, res) => {

        try {

            const id =
                req.params.id;


            const update =
                await getBlockchainUpdate(
                    id
                );


            res.status(200).json({

                success: true,

                data:
                    update

            });


        } catch (error) {

            console.error(
                "BLOCKCHAIN UPDATE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve blockchain update",

                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? error.message
                        : undefined

            });

        }

    }
);


// =====================================================
// 9. STATISTICS
// =====================================================

router.get(
    "/stats",
    async (req, res) => {

        const session =
            driver.session();


        try {

            const nodeResult =
                await session.run(`
                    MATCH (n)

                    RETURN
                        count(n)
                            AS count
                `);


            const relationshipResult =
                await session.run(`
                    MATCH ()-[r]->()

                    RETURN
                        count(r)
                            AS count
                `);


            const updateResult =
                await session.run(`
                    MATCH (u:GraphUpdate)

                    RETURN

                        count(u)
                            AS total,

                        count(
                            CASE

                                WHEN
                                    u.blockchainVerified
                                    = true

                                THEN 1

                            END
                        )
                            AS verified,

                        count(
                            CASE

                                WHEN
                                    u.signingMethod
                                    = "METAMASK"

                                THEN 1

                            END
                        )
                            AS metamaskSigned
                `);


            const blockchainCount =
                await getBlockchainUpdateCount();


            res.status(200).json({

                success: true,

                data: {

                    totalNodes:
                        neo4jNumber(
                            nodeResult
                                .records[0]
                                .get("count")
                        ),

                    totalRelationships:
                        neo4jNumber(
                            relationshipResult
                                .records[0]
                                .get("count")
                        ),

                    graphUpdates:
                        neo4jNumber(
                            updateResult
                                .records[0]
                                .get("total")
                        ),

                    blockchainVerified:
                        neo4jNumber(
                            updateResult
                                .records[0]
                                .get("verified")
                        ),

                    metamaskSigned:
                        neo4jNumber(
                            updateResult
                                .records[0]
                                .get(
                                    "metamaskSigned"
                                )
                        ),

                    blockchainRecords:
                        blockchainCount

                }

            });


        } catch (error) {

            console.error(
                "STATS ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve statistics"

            });


        } finally {

            await session.close();

        }

    }
);


module.exports = router;