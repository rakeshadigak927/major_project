require("dotenv").config();

const {
    submitGraphUpdate,
    getBlockchainUpdateCount,
    verifyGraphUpdate
} = require("./services/blockchainService");


async function testBlockchainWrite() {

    console.log("");
    console.log("========================================");
    console.log(" BLOCKCHAIN WRITE TEST");
    console.log("========================================");


    try {

        // =============================================
        // BEFORE
        // =============================================

        const before =
            await getBlockchainUpdateCount();


        console.log("");
        console.log(
            "Updates before:",
            before
        );


        // =============================================
        // TEST KNOWLEDGE UPDATE
        // =============================================

        const testUpdateId =
            "TEST-" + Date.now();


        const result =
            await submitGraphUpdate({

                updateId:
                    testUpdateId,

                studentId:
                    "ST001",

                certificateId:
                    "TEST-CERT-001",

                certificateName:
                    "Blockchain Integration Test",

                issuer:
                    "Knowledge Graph Project",

                submittedBy:
                    "ACT001"

            });


        console.log("");
        console.log(
            "Blockchain write successful"
        );


        console.log(
            "Update ID:",
            testUpdateId
        );


        console.log(
            "Blockchain Update ID:",
            result.blockchainUpdateId
        );


        console.log(
            "Hash:",
            result.dataHash
        );


        console.log(
            "Transaction:",
            result.transactionHash
        );


        console.log(
            "Block:",
            result.blockNumber
        );


        // =============================================
        // VERIFY
        // =============================================

        const verified =
            await verifyGraphUpdate(
                result.blockchainUpdateId,
                result.dataHash
            );


        console.log("");
        console.log(
            "Hash verified:",
            verified
        );


        if (!verified) {

            throw new Error(
                "Blockchain hash verification failed"
            );

        }


        // =============================================
        // AFTER
        // =============================================

        const after =
            await getBlockchainUpdateCount();


        console.log("");
        console.log(
            "Updates after:",
            after
        );


        // =============================================
        // SUCCESS
        // =============================================

        console.log("");
        console.log("========================================");
        console.log(" BLOCKCHAIN WRITE TEST PASSED");
        console.log("========================================");

        console.log("");
        console.log(
            "Knowledge update permanently anchored"
        );

        console.log(
            "on Ethereum Sepolia."
        );

        console.log("");


        process.exit(0);


    } catch (error) {

        console.error("");
        console.error("========================================");
        console.error(" BLOCKCHAIN WRITE TEST FAILED");
        console.error("========================================");

        console.error("");
        console.error(
            error.message
        );

        console.error("");


        process.exit(1);

    }

}


testBlockchainWrite();