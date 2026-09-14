const crypto = require("crypto");

const {
    contract,
    provider
} = require("../config/blockchain");


// =====================================================
// CREATE CANONICAL KNOWLEDGE DATA
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
// GENERATE SHA-256 HASH
// =====================================================

function generateHash(data) {

    const canonicalString =
        JSON.stringify(data);

    return crypto
        .createHash("sha256")
        .update(canonicalString)
        .digest("hex");

}


// =====================================================
// SUBMIT UPDATE TO BLOCKCHAIN
// =====================================================

async function submitGraphUpdate({
    updateId,
    studentId,
    certificateId,
    certificateName,
    issuer,
    submittedBy
}) {

    // -------------------------------------------------
    // 1. CREATE CANONICAL DATA
    // -------------------------------------------------

    const canonicalData =
        createCanonicalData({
            updateId,
            studentId,
            certificateId,
            certificateName,
            issuer,
            submittedBy
        });


    // -------------------------------------------------
    // 2. GENERATE HASH
    // -------------------------------------------------

    const dataHash =
        generateHash(canonicalData);


    // -------------------------------------------------
    // 3. CREATE METADATA
    // -------------------------------------------------

    const metadata =
        JSON.stringify({
            type: "KNOWLEDGE_GRAPH_UPDATE",
            source: studentId,
            relationship: "EARNED",
            target: certificateId
        });


    console.log("");
    console.log(
        "Submitting graph update to Sepolia..."
    );

    console.log(
        "Update ID:",
        updateId
    );

    console.log(
        "Data Hash:",
        dataHash
    );


    // -------------------------------------------------
    // 4. SEND BLOCKCHAIN TRANSACTION
    // -------------------------------------------------

    const transaction =
        await contract.submitUpdate(
            updateId,
            dataHash,
            metadata
        );


    console.log(
        "Transaction submitted:",
        transaction.hash
    );


    // -------------------------------------------------
    // 5. WAIT FOR CONFIRMATION
    // -------------------------------------------------

    const receipt =
        await transaction.wait();


    if (!receipt) {

        throw new Error(
            "Blockchain transaction receipt not received"
        );

    }


    if (receipt.status !== 1) {

        throw new Error(
            "Blockchain transaction failed"
        );

    }


    console.log(
        "Blockchain transaction confirmed"
    );

    console.log(
        "Block:",
        receipt.blockNumber
    );


    // -------------------------------------------------
    // 6. FIND BLOCKCHAIN UPDATE ID FROM EVENT
    // -------------------------------------------------

    let blockchainUpdateId = null;


    for (const log of receipt.logs) {

        try {

            const parsedLog =
                contract.interface.parseLog(log);


            if (
                parsedLog &&
                parsedLog.name ===
                    "UpdateSubmitted"
            ) {

                blockchainUpdateId =
                    parsedLog.args.id.toString();

                break;

            }

        } catch (error) {

            // Ignore unrelated logs

        }

    }


    // -------------------------------------------------
    // 7. RETURN BLOCKCHAIN PROOF
    // -------------------------------------------------

    return {

        canonicalData,

        dataHash,

        metadata,

        transactionHash:
            transaction.hash,

        blockNumber:
            receipt.blockNumber,

        blockchainUpdateId,

        status:
            "BLOCKCHAIN_VERIFIED"

    };

}


// =====================================================
// VERIFY BLOCKCHAIN UPDATE
// =====================================================

async function verifyGraphUpdate(
    blockchainUpdateId,
    dataHash
) {

    const verified =
        await contract.verifyUpdate(
            blockchainUpdateId,
            dataHash
        );


    return verified;

}


// =====================================================
// GET BLOCKCHAIN UPDATE COUNT
// =====================================================

async function getBlockchainUpdateCount() {

    const count =
        await contract.getUpdateCount();


    return Number(count);

}


// =====================================================
// GET BLOCKCHAIN UPDATE
// =====================================================

async function getBlockchainUpdate(
    blockchainUpdateId
) {

    const update =
        await contract.getUpdate(
            blockchainUpdateId
        );


    return {

        id:
            update[0].toString(),

        submitter:
            update[1],

        updateId:
            update[2],

        dataHash:
            update[3],

        metadata:
            update[4],

        timestamp:
            update[5].toString()

    };

}


// =====================================================
// CHECK TRANSACTION
// =====================================================

async function getTransactionReceipt(
    transactionHash
) {

    const receipt =
        await provider.getTransactionReceipt(
            transactionHash
        );


    if (!receipt) {

        return null;

    }


    return {

        transactionHash:
            receipt.hash,

        blockNumber:
            receipt.blockNumber,

        status:
            receipt.status === 1
                ? "SUCCESS"
                : "FAILED"

    };

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createCanonicalData,

    generateHash,

    submitGraphUpdate,

    verifyGraphUpdate,

    getBlockchainUpdateCount,

    getBlockchainUpdate,

    getTransactionReceipt

};