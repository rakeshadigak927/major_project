const express = require("express");
const crypto = require("crypto");

const driver = require("../config/neo4j");

const {
    provider,
    contract
} = require("../config/blockchain");

const router = express.Router();


// =====================================================
// CREATE CANONICAL DATA
// MUST MATCH blockchainService.js EXACTLY
// =====================================================

function createCanonicalData({
    updateId,
    studentId,
    certificateId,
    certificateName,
    issuer,
    submittedBy
}) {
    return {
        updateId: String(updateId),
        studentId: String(studentId),
        relationship: "EARNED",
        certificateId: String(certificateId),
        certificateName: String(certificateName),
        issuer: String(issuer),
        submittedBy: String(submittedBy)
    };
}


// =====================================================
// SHA-256
// =====================================================

function generateHash(data) {
    return crypto
        .createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex");
}


// =====================================================
// 1. PREPARE KNOWLEDGE
// =====================================================

router.post(
    "/prepare",
    async (req, res) => {

        const {
            studentId,
            certificateId,
            certificateName,
            issuer,
            submittedBy
        } = req.body;


        // =============================================
        // VALIDATION
        // =============================================

        if (
            !studentId ||
            !certificateId ||
            !certificateName ||
            !issuer ||
            !submittedBy
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }


        const session = driver.session();

        let updateId = null;


        try {

            // =========================================
            // CHECK STUDENT
            // =========================================

            const studentResult =
                await session.run(
                    `
                    MATCH (s:Student {
                        studentId: $studentId
                    })

                    RETURN s
                    `,
                    {
                        studentId
                    }
                );


            if (
                studentResult.records.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
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
                            studentId: $studentId
                        })
                        -[:EARNED]->
                        (c:Certificate {
                            certificateId: $certificateId
                        })

                    RETURN c
                    `,
                    {
                        studentId,
                        certificateId
                    }
                );


            if (
                duplicateResult.records.length > 0
            ) {
                return res.status(409).json({
                    success: false,
                    message: "This knowledge already exists"
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
            // CREATE CANONICAL DATA
            // =========================================

            const canonicalData =
                createCanonicalData({
                    updateId,
                    studentId,
                    certificateId,
                    certificateName,
                    issuer,
                    submittedBy
                });


            // =========================================
            // GENERATE HASH
            // =========================================

            const dataHash =
                generateHash(canonicalData);


            // =========================================
            // BLOCKCHAIN METADATA
            // =========================================

            const metadata =
                JSON.stringify({
                    type: "KNOWLEDGE_GRAPH_UPDATE",
                    source: studentId,
                    relationship: "EARNED",
                    target: certificateId
                });


            // =========================================
            // CREATE PENDING NEO4J UPDATE
            // =========================================

            await session.executeWrite(
                async tx => {

                    await tx.run(
                        `
                        MATCH (s:Student {
                            studentId: $studentId
                        })


                        MERGE (cert:Certificate {
                            certificateId: $certificateId
                        })


                        ON CREATE SET
                            cert.name = $certificateName,
                            cert.issuer = $issuer,
                            cert.createdAt = datetime()


                        ON MATCH SET
                            cert.name = $certificateName,
                            cert.issuer = $issuer


                        CREATE
                            (s)-[:EARNED {
                                year: 2026,
                                createdAt: datetime(),
                                updateId: $updateId
                            }]->(cert)


                        CREATE (u:GraphUpdate {

                            updateId: $updateId,

                            action: "ADD_RELATIONSHIP",

                            entityType: "Student",

                            entityId: $studentId,

                            relationship: "EARNED",

                            targetType: "Certificate",

                            targetId: $certificateId,

                            description:
                                "Student earned a new certificate",

                            status:
                                "AWAITING_METAMASK",

                            blockchainVerified:
                                false,

                            dataHash:
                                $dataHash,

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
                            actorId: $submittedBy
                        })


                        ON CREATE SET
                            actor.name = $submittedBy,

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
                            updateId,
                            dataHash
                        }
                    );
                }
            );


            // =========================================
            // SEND DATA TO FRONTEND
            // =========================================

            return res.status(201).json({

                success: true,

                message:
                    "Knowledge prepared. Confirm the blockchain transaction in MetaMask.",

                data: {

                    updateId,

                    dataHash,

                    metadata,

                    canonicalData,

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
                            "AWAITING_METAMASK",

                        verified:
                            false

                    }

                }

            });


        } catch (error) {

            console.error(
                "METAMASK PREPARE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to prepare knowledge",

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
// 2. CONFIRM METAMASK TRANSACTION
//
// IMPORTANT:
// EIP-7702 transactions can have a top-level
// receipt.to address that is NOT the application
// smart contract.
//
// Therefore we DO NOT compare:
//
//     receipt.to === CONTRACT_ADDRESS
//
// Instead we verify that our configured contract
// emitted the UpdateSubmitted event.
// =====================================================

router.post(
    "/confirm",
    async (req, res) => {

        const {
            updateId,
            dataHash,
            transactionHash,
            blockchainUpdateId,
            walletAddress
        } = req.body;


        // =========================================
        // VALIDATION
        // =========================================

        if (
            !updateId ||
            !dataHash ||
            !transactionHash ||
            blockchainUpdateId === null ||
            blockchainUpdateId === undefined
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Blockchain confirmation data is incomplete"

            });

        }


        const session =
            driver.session();


        try {

            // =========================================
            // FIND PENDING UPDATE IN NEO4J
            // =========================================

            const graphResult =
                await session.run(
                    `
                    MATCH (u:GraphUpdate {
                        updateId: $updateId
                    })

                    RETURN
                        u.dataHash AS storedHash,
                        u.status AS status
                    `,
                    {
                        updateId
                    }
                );


            if (
                graphResult.records.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Pending graph update not found"

                });

            }


            const storedHash =
                graphResult.records[0]
                    .get("storedHash");


            // =========================================
            // VERIFY HASH
            // =========================================

            if (
                storedHash !== dataHash
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Data hash does not match the prepared graph update"

                });

            }


            // =========================================
            // GET TRANSACTION RECEIPT
            // =========================================

            const receipt =
                await provider.getTransactionReceipt(
                    transactionHash
                );


            if (!receipt) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Transaction has not been confirmed on Sepolia"

                });

            }


            // =========================================
            // TRANSACTION MUST SUCCEED
            // =========================================

            if (
                Number(receipt.status) !== 1
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Sepolia transaction failed"

                });

            }


            // =========================================
            // VERIFY OUR CONTRACT EMITTED
            // UpdateSubmitted
            //
            // DO NOT CHECK receipt.to.
            //
            // With EIP-7702 the top-level transaction
            // recipient can be another contract.
            // =========================================

            const configuredContractAddress =
                process.env.CONTRACT_ADDRESS.toLowerCase();


            let submittedEvent = null;


            for (
                const log of receipt.logs
            ) {

                // Only inspect logs emitted by
                // our configured Knowledge Graph contract.

                if (
                    !log.address ||
                    log.address.toLowerCase() !==
                        configuredContractAddress
                ) {
                    continue;
                }


                try {

                    const parsedLog =
                        contract.interface.parseLog(
                            log
                        );


                    if (
                        parsedLog &&
                        parsedLog.name ===
                            "UpdateSubmitted"
                    ) {

                        submittedEvent =
                            parsedLog;

                        break;

                    }

                } catch (error) {

                    // Ignore unrelated logs.

                }

            }


            // =========================================
            // EVENT MUST EXIST
            // =========================================

            if (!submittedEvent) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Transaction succeeded, but the configured smart contract did not emit UpdateSubmitted"

                });

            }


            // =========================================
            // VERIFY BLOCKCHAIN EVENT ID
            // =========================================

            const eventBlockchainUpdateId =
                submittedEvent.args.id.toString();


            if (
                eventBlockchainUpdateId !==
                String(blockchainUpdateId)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Blockchain event ID does not match the submitted blockchain update ID"

                });

            }


            // =========================================
            // VERIFY EVENT UPDATE ID
            // =========================================

            const eventUpdateId =
                submittedEvent.args.updateId;


            if (
                eventUpdateId !== updateId
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Blockchain event update ID does not match the Neo4j update"

                });

            }


            // =========================================
            // VERIFY EVENT DATA HASH
            // =========================================

            const eventDataHash =
                submittedEvent.args.dataHash;


            if (
                eventDataHash !== dataHash
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Blockchain event hash does not match the Neo4j hash"

                });

            }


            // =========================================
            // READ ACTUAL BLOCKCHAIN RECORD
            // =========================================

            const blockchainRecord =
                await contract.getUpdate(
                    blockchainUpdateId
                );


            const chainSubmitter =
                blockchainRecord[1];


            const chainUpdateId =
                blockchainRecord[2];


            const chainHash =
                blockchainRecord[3];


            // =========================================
            // VERIFY BLOCKCHAIN UPDATE ID
            // =========================================

            if (
                chainUpdateId !== updateId
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Blockchain update ID does not match the Neo4j update"

                });

            }


            // =========================================
            // VERIFY BLOCKCHAIN HASH
            // =========================================

            if (
                chainHash !== dataHash
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Blockchain hash does not match the Neo4j hash"

                });

            }


            // =========================================
            // VERIFY SUBMITTER
            // =========================================

            if (
                walletAddress &&
                chainSubmitter &&
                chainSubmitter.toLowerCase() !==
                    walletAddress.toLowerCase()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Blockchain submitter does not match the connected MetaMask wallet"

                });

            }


            // =========================================
            // SMART CONTRACT INTEGRITY CHECK
            // =========================================

            const integrityValid =
                await contract.verifyUpdate(
                    blockchainUpdateId,
                    dataHash
                );


            if (!integrityValid) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Smart contract integrity verification failed"

                });

            }


            // =========================================
            // SAVE VERIFIED PROOF TO NEO4J
            // =========================================

            await session.run(
                `
                MATCH (u:GraphUpdate {
                    updateId: $updateId
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

                    u.walletAddress =
                        $walletAddress,

                    u.signingMethod =
                        "METAMASK",

                    u.blockchainConfirmedAt =
                        datetime()
                `,
                {

                    updateId,

                    dataHash,

                    transactionHash,

                    blockNumber:
                        receipt.blockNumber,

                    blockchainUpdateId:
                        String(
                            blockchainUpdateId
                        ),

                    walletAddress:
                        walletAddress ||
                        chainSubmitter

                }
            );


            // =========================================
            // SUCCESS
            // =========================================

            return res.status(200).json({

                success: true,

                message:
                    "MetaMask transaction verified and knowledge anchored successfully",

                data: {

                    updateId,

                    blockchain: {

                        status:
                            "BLOCKCHAIN_VERIFIED",

                        verified:
                            true,

                        signingMethod:
                            "METAMASK",

                        walletAddress:
                            walletAddress ||
                            chainSubmitter,

                        blockchainUpdateId:
                            String(
                                blockchainUpdateId
                            ),

                        dataHash,

                        transactionHash,

                        blockNumber:
                            receipt.blockNumber,

                        contractAddress:
                            process.env
                                .CONTRACT_ADDRESS

                    }

                }

            });


        } catch (error) {

            console.error(
                "METAMASK CONFIRM ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to confirm MetaMask blockchain transaction",

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
// EXPORT ROUTER
// =====================================================

module.exports = router;