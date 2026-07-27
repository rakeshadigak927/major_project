const { ethers } = require("ethers");

// =====================================================
// VALIDATE ENVIRONMENT VARIABLES
// =====================================================

if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error(
        "SEPOLIA_RPC_URL is missing from .env"
    );
}

if (!process.env.CONTRACT_ADDRESS) {
    throw new Error(
        "CONTRACT_ADDRESS is missing from .env"
    );
}

if (!process.env.BACKEND_WALLET_PRIVATE_KEY) {
    throw new Error(
        "BACKEND_WALLET_PRIVATE_KEY is missing from .env"
    );
}


// =====================================================
// SMART CONTRACT ABI
// =====================================================

const CONTRACT_ABI = [

    "function admin() view returns (address)",

    "function authorizedProviders(address) view returns (bool)",

    "function isAuthorizedProvider(address _provider) view returns (bool)",

    "function getUpdateCount() view returns (uint256)",

    "function getUpdate(uint256 _id) view returns (uint256 id, address submitter, string updateId, string dataHash, string metadata, uint256 timestamp)",

    "function verifyUpdate(uint256 _id, string _dataHash) view returns (bool)",

    "function submitUpdate(string _updateId, string _dataHash, string _metadata)",

    "function authorizeProvider(address _provider)",

    "function revokeProvider(address _provider)",

    "event UpdateSubmitted(uint256 indexed id, address indexed submitter, string updateId, string dataHash, string metadata, uint256 timestamp)"

];


// =====================================================
// PROVIDER
// =====================================================

const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL
);


// =====================================================
// BACKEND WALLET
// =====================================================

const wallet = new ethers.Wallet(
    process.env.BACKEND_WALLET_PRIVATE_KEY,
    provider
);


// =====================================================
// SMART CONTRACT
// =====================================================

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    CONTRACT_ABI,
    wallet
);


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    ethers,
    provider,
    wallet,
    contract,
    CONTRACT_ABI
};