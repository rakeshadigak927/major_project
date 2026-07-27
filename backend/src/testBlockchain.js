require("dotenv").config();

const {
    ethers,
    provider,
    wallet,
    contract
} = require("./config/blockchain");


async function testBlockchain() {

    console.log("");
    console.log("==========================================");
    console.log(" KNOWLEDGE GRAPH BLOCKCHAIN TEST");
    console.log("==========================================");
    console.log("");


    try {

        // =============================================
        // 1. TEST RPC CONNECTION
        // =============================================

        console.log("1. Connecting to Sepolia...");

        const network =
            await provider.getNetwork();

        console.log(
            "   Network:",
            network.name
        );

        console.log(
            "   Chain ID:",
            network.chainId.toString()
        );


        if (network.chainId !== 11155111n) {

            throw new Error(
                "Wrong blockchain network. Expected Sepolia."
            );

        }

        console.log(
            "   Sepolia connection: OK"
        );


        // =============================================
        // 2. CHECK BLOCK NUMBER
        // =============================================

        console.log("");
        console.log(
            "2. Checking latest block..."
        );

        const blockNumber =
            await provider.getBlockNumber();

        console.log(
            "   Latest block:",
            blockNumber
        );


        // =============================================
        // 3. CHECK BACKEND WALLET
        // =============================================

        console.log("");
        console.log(
            "3. Checking backend wallet..."
        );

        console.log(
            "   Wallet:",
            wallet.address
        );


        const balance =
            await provider.getBalance(
                wallet.address
            );

        console.log(
            "   Balance:",
            ethers.formatEther(balance),
            "ETH"
        );


        if (balance === 0n) {

            throw new Error(
                "Backend wallet has no Sepolia ETH."
            );

        }


        // =============================================
        // 4. CHECK CONTRACT
        // =============================================

        console.log("");
        console.log(
            "4. Checking smart contract..."
        );

        console.log(
            "   Contract:",
            process.env.CONTRACT_ADDRESS
        );


        const code =
            await provider.getCode(
                process.env.CONTRACT_ADDRESS
            );


        if (code === "0x") {

            throw new Error(
                "No smart contract found at CONTRACT_ADDRESS."
            );

        }


        console.log(
            "   Contract exists: YES"
        );


        // =============================================
        // 5. CHECK ADMIN
        // =============================================

        console.log("");
        console.log(
            "5. Reading contract admin..."
        );


        const admin =
            await contract.admin();


        console.log(
            "   Admin:",
            admin
        );


        // =============================================
        // 6. CHECK AUTHORIZATION
        // =============================================

        console.log("");
        console.log(
            "6. Checking backend authorization..."
        );


        const authorized =
            await contract.isAuthorizedProvider(
                wallet.address
            );


        console.log(
            "   Authorized:",
            authorized
        );


        if (!authorized) {

            throw new Error(
                "Backend wallet is NOT authorized."
            );

        }


        // =============================================
        // 7. CHECK UPDATE COUNT
        // =============================================

        console.log("");
        console.log(
            "7. Reading blockchain update count..."
        );


        const updateCount =
            await contract.getUpdateCount();


        console.log(
            "   Updates stored:",
            updateCount.toString()
        );


        // =============================================
        // SUCCESS
        // =============================================

        console.log("");
        console.log("==========================================");
        console.log(" ALL BLOCKCHAIN TESTS PASSED");
        console.log("==========================================");

        console.log("");
        console.log(
            "Node.js -> Alchemy -> Sepolia -> Contract"
        );

        console.log(
            "Connection successful."
        );

        console.log("");


        process.exit(0);


    } catch (error) {

        console.error("");
        console.error("==========================================");
        console.error(" BLOCKCHAIN TEST FAILED");
        console.error("==========================================");
        console.error("");

        console.error(
            error.message
        );

        console.error("");

        process.exit(1);

    }

}


testBlockchain();