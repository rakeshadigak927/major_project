import {
  BrowserProvider,
  Contract,
  isAddress,
  formatEther,
} from "ethers";


// =====================================================
// NETWORK
// =====================================================

export const SEPOLIA_CHAIN_ID = "0xaa36a7";

export const SEPOLIA_CHAIN_ID_DECIMAL =
  11155111;


// =====================================================
// SMART CONTRACT
// =====================================================

export const CONTRACT_ADDRESS =
  "0xf3507c511448f18FEc83277779086371ACA280A4";


// =====================================================
// ABI
// =====================================================

export const CONTRACT_ABI = [

  "function admin() view returns (address)",

  "function authorizedProviders(address) view returns (bool)",

  "function isAuthorizedProvider(address _provider) view returns (bool)",

  "function getUpdateCount() view returns (uint256)",

  "function getUpdate(uint256 _id) view returns (uint256 id, address submitter, string updateId, string dataHash, string metadata, uint256 timestamp)",

  "function verifyUpdate(uint256 _id, string _dataHash) view returns (bool)",

  "function submitUpdate(string _updateId, string _dataHash, string _metadata)",

  // ADMIN FUNCTIONS

  "function authorizeProvider(address _provider)",

  "function revokeProvider(address _provider)",

  // EVENTS

  "event UpdateSubmitted(uint256 indexed id, address indexed submitter, string updateId, string dataHash, string metadata, uint256 timestamp)",

];


// =====================================================
// CHECK METAMASK
// =====================================================

export function isMetaMaskInstalled() {

  return Boolean(
    window.ethereum &&
    window.ethereum.isMetaMask
  );

}


// =====================================================
// PROVIDER
// =====================================================

export function getMetaMaskProvider() {

  if (!isMetaMaskInstalled()) {

    throw new Error(
      "MetaMask is not installed."
    );

  }


  return new BrowserProvider(
    window.ethereum
  );

}


// =====================================================
// NETWORK
// =====================================================

export async function getCurrentNetwork() {

  const provider =
    getMetaMaskProvider();


  const network =
    await provider.getNetwork();


  const chainId =
    Number(
      network.chainId
    );


  return {

    chainId,

    name:
      network.name,

    isSepolia:
      chainId ===
      SEPOLIA_CHAIN_ID_DECIMAL,

  };

}


// =====================================================
// SWITCH TO SEPOLIA
// =====================================================

export async function switchToSepolia() {

  if (!isMetaMaskInstalled()) {

    throw new Error(
      "MetaMask is not installed."
    );

  }


  try {

    await window.ethereum.request({

      method:
        "wallet_switchEthereumChain",

      params: [

        {
          chainId:
            SEPOLIA_CHAIN_ID,
        },

      ],

    });


  } catch (error) {


    if (
      error.code === 4001
    ) {

      throw new Error(
        "Sepolia network switch was rejected."
      );

    }


    if (
      error.code === 4902
    ) {

      throw new Error(
        "Sepolia is not enabled in MetaMask."
      );

    }


    throw error;

  }

}


// =====================================================
// CONNECT METAMASK
// =====================================================

export async function connectMetaMask() {

  if (!isMetaMaskInstalled()) {

    throw new Error(
      "MetaMask is not installed."
    );

  }


  const accounts =
    await window.ethereum.request({

      method:
        "eth_requestAccounts",

    });


  if (
    !accounts ||
    accounts.length === 0
  ) {

    throw new Error(
      "No MetaMask account selected."
    );

  }


  let network =
    await getCurrentNetwork();


  if (!network.isSepolia) {

    await switchToSepolia();


    network =
      await getCurrentNetwork();

  }


  if (!network.isSepolia) {

    throw new Error(
      "Please connect MetaMask to Ethereum Sepolia."
    );

  }


  const provider =
    getMetaMaskProvider();


  const signer =
    await provider.getSigner();


  const address =
    await signer.getAddress();


  return {

    provider,

    signer,

    address,

    network,

  };

}


// =====================================================
// EXISTING ACCOUNTS
// =====================================================

export async function getConnectedAccounts() {

  if (!isMetaMaskInstalled()) {

    return [];

  }


  const accounts =
    await window.ethereum.request({

      method:
        "eth_accounts",

    });


  return accounts || [];

}


// =====================================================
// WALLET BALANCE
// =====================================================

export async function getWalletBalance(
  address
) {

  if (!isAddress(address)) {

    throw new Error(
      "Invalid wallet address."
    );

  }


  const provider =
    getMetaMaskProvider();


  const balance =
    await provider.getBalance(
      address
    );


  return formatEther(
    balance
  );

}


// =====================================================
// READ-ONLY CONTRACT
// =====================================================

export function getReadOnlyContract() {

  const provider =
    getMetaMaskProvider();


  return new Contract(

    CONTRACT_ADDRESS,

    CONTRACT_ABI,

    provider

  );

}


// =====================================================
// SIGNED CONTRACT
// =====================================================

export async function getSignedContract() {

  const wallet =
    await connectMetaMask();


  const contract =
    new Contract(

      CONTRACT_ADDRESS,

      CONTRACT_ABI,

      wallet.signer

    );


  return {

    ...wallet,

    contract,

  };

}


// =====================================================
// CHECK PROVIDER AUTHORIZATION
// =====================================================

export async function checkAuthorization(
  walletAddress
) {

  if (!isAddress(walletAddress)) {

    throw new Error(
      "Invalid wallet address."
    );

  }


  const contract =
    getReadOnlyContract();


  const authorized =
    await contract.isAuthorizedProvider(
      walletAddress
    );


  return Boolean(
    authorized
  );

}


// =====================================================
// CONTRACT ADMIN
// =====================================================

export async function getContractAdmin() {

  const contract =
    getReadOnlyContract();


  return await contract.admin();

}


// =====================================================
// CHECK IF A WALLET IS ADMIN
// =====================================================

export async function isWalletAdmin(
  walletAddress
) {

  if (!isAddress(walletAddress)) {

    throw new Error(
      "Invalid wallet address."
    );

  }


  const adminAddress =
    await getContractAdmin();


  return (
    adminAddress.toLowerCase() ===
    walletAddress.toLowerCase()
  );

}


// =====================================================
// CHECK CURRENT METAMASK ACCOUNT IS ADMIN
// =====================================================

export async function isConnectedWalletAdmin() {

  const wallet =
    await connectMetaMask();


  const adminAddress =
    await getContractAdmin();


  const isAdmin =
    adminAddress.toLowerCase() ===
    wallet.address.toLowerCase();


  return {

    isAdmin,

    walletAddress:
      wallet.address,

    adminAddress,

  };

}


// =====================================================
// AUTHORIZE PROVIDER
//
// Only the contract admin can execute this.
// MetaMask will open for confirmation.
// =====================================================

export async function authorizeProviderWithMetaMask(
  providerAddress
) {

  if (
    !isAddress(
      providerAddress
    )
  ) {

    throw new Error(
      "Enter a valid Ethereum wallet address."
    );

  }


  const wallet =
    await getSignedContract();


  // ===============================================
  // CHECK ADMIN
  // ===============================================

  const adminAddress =
    await wallet.contract.admin();


  if (
    adminAddress.toLowerCase() !==
    wallet.address.toLowerCase()
  ) {

    throw new Error(
      "Only the smart contract admin can authorize providers."
    );

  }


  // ===============================================
  // CHECK CURRENT STATUS
  // ===============================================

  const alreadyAuthorized =
    await wallet.contract
      .isAuthorizedProvider(
        providerAddress
      );


  if (alreadyAuthorized) {

    throw new Error(
      "This wallet is already an authorized provider."
    );

  }


  // ===============================================
  // SEND ADMIN TRANSACTION
  // ===============================================

  let transaction;


  try {

    transaction =
      await wallet.contract
        .authorizeProvider(
          providerAddress
        );


  } catch (error) {

    if (
      error.code === 4001 ||
      error.code ===
        "ACTION_REJECTED"
    ) {

      throw new Error(
        "Authorization transaction was rejected in MetaMask."
      );

    }


    throw error;

  }


  // ===============================================
  // WAIT FOR CONFIRMATION
  // ===============================================

  const receipt =
    await transaction.wait();


  if (!receipt) {

    throw new Error(
      "Authorization transaction receipt was not returned."
    );

  }


  if (
    Number(
      receipt.status
    ) !== 1
  ) {

    throw new Error(
      "Provider authorization transaction failed."
    );

  }


  // ===============================================
  // VERIFY CONTRACT STATE
  // ===============================================

  const authorized =
    await wallet.contract
      .isAuthorizedProvider(
        providerAddress
      );


  if (!authorized) {

    throw new Error(
      "Transaction was confirmed, but provider authorization could not be verified."
    );

  }


  return {

    success: true,

    action:
      "AUTHORIZED",

    providerAddress,

    adminAddress:
      wallet.address,

    transactionHash:
      transaction.hash,

    blockNumber:
      Number(
        receipt.blockNumber
      ),

    authorized:
      true,

  };

}


// =====================================================
// REVOKE PROVIDER
//
// Only the contract admin can execute this.
// MetaMask will open for confirmation.
// =====================================================

export async function revokeProviderWithMetaMask(
  providerAddress
) {

  if (
    !isAddress(
      providerAddress
    )
  ) {

    throw new Error(
      "Enter a valid Ethereum wallet address."
    );

  }


  const wallet =
    await getSignedContract();


  // ===============================================
  // CHECK ADMIN
  // ===============================================

  const adminAddress =
    await wallet.contract.admin();


  if (
    adminAddress.toLowerCase() !==
    wallet.address.toLowerCase()
  ) {

    throw new Error(
      "Only the smart contract admin can revoke providers."
    );

  }


  // ===============================================
  // CHECK CURRENT STATUS
  // ===============================================

  const currentlyAuthorized =
    await wallet.contract
      .isAuthorizedProvider(
        providerAddress
      );


  if (!currentlyAuthorized) {

    throw new Error(
      "This wallet is not currently an authorized provider."
    );

  }


  // ===============================================
  // SEND ADMIN TRANSACTION
  // ===============================================

  let transaction;


  try {

    transaction =
      await wallet.contract
        .revokeProvider(
          providerAddress
        );


  } catch (error) {

    if (
      error.code === 4001 ||
      error.code ===
        "ACTION_REJECTED"
    ) {

      throw new Error(
        "Revoke transaction was rejected in MetaMask."
      );

    }


    throw error;

  }


  // ===============================================
  // WAIT FOR CONFIRMATION
  // ===============================================

  const receipt =
    await transaction.wait();


  if (!receipt) {

    throw new Error(
      "Revoke transaction receipt was not returned."
    );

  }


  if (
    Number(
      receipt.status
    ) !== 1
  ) {

    throw new Error(
      "Provider revoke transaction failed."
    );

  }


  // ===============================================
  // VERIFY CONTRACT STATE
  // ===============================================

  const stillAuthorized =
    await wallet.contract
      .isAuthorizedProvider(
        providerAddress
      );


  if (stillAuthorized) {

    throw new Error(
      "Transaction was confirmed, but provider revocation could not be verified."
    );

  }


  return {

    success: true,

    action:
      "REVOKED",

    providerAddress,

    adminAddress:
      wallet.address,

    transactionHash:
      transaction.hash,

    blockNumber:
      Number(
        receipt.blockNumber
      ),

    authorized:
      false,

  };

}


// =====================================================
// BLOCKCHAIN UPDATE COUNT
// =====================================================

export async function getBlockchainUpdateCount() {

  const contract =
    getReadOnlyContract();


  const count =
    await contract.getUpdateCount();


  return Number(
    count
  );

}


// =====================================================
// SUBMIT KNOWLEDGE USING METAMASK
// =====================================================

export async function submitUpdateWithMetaMask({

  updateId,

  dataHash,

  metadata,

}) {

  if (!updateId) {

    throw new Error(
      "Update ID is required."
    );

  }


  if (!dataHash) {

    throw new Error(
      "Data hash is required."
    );

  }


  if (!metadata) {

    throw new Error(
      "Blockchain metadata is required."
    );

  }


  // ===============================================
  // CONNECT
  // ===============================================

  const wallet =
    await connectMetaMask();


  // ===============================================
  // CHECK AUTHORIZATION
  // ===============================================

  const authorized =
    await checkAuthorization(
      wallet.address
    );


  if (!authorized) {

    throw new Error(
      `Wallet ${wallet.address} is not an authorized provider.`
    );

  }


  // ===============================================
  // CONTRACT WITH METAMASK SIGNER
  // ===============================================

  const contract =
    new Contract(

      CONTRACT_ADDRESS,

      CONTRACT_ABI,

      wallet.signer

    );


  // ===============================================
  // SEND TRANSACTION
  // ===============================================

  let transaction;


  try {

    transaction =
      await contract.submitUpdate(

        updateId,

        dataHash,

        metadata

      );


  } catch (error) {

    if (
      error.code === 4001 ||
      error.code ===
        "ACTION_REJECTED"
    ) {

      throw new Error(
        "Transaction was rejected in MetaMask."
      );

    }


    throw error;

  }


  // ===============================================
  // WAIT FOR MINING
  // ===============================================

  const receipt =
    await transaction.wait();


  if (!receipt) {

    throw new Error(
      "Transaction receipt was not returned."
    );

  }


  if (
    Number(
      receipt.status
    ) !== 1
  ) {

    throw new Error(
      "Blockchain transaction failed."
    );

  }


  // ===============================================
  // READ UpdateSubmitted EVENT
  // ===============================================

  let blockchainUpdateId =
    null;


  for (
    const log of receipt.logs
  ) {

    try {

      const parsedLog =
        contract.interface
          .parseLog(log);


      if (
        parsedLog &&
        parsedLog.name ===
          "UpdateSubmitted"
      ) {

        blockchainUpdateId =
          parsedLog.args
            .id
            .toString();


        break;

      }

    } catch {

      // Ignore unrelated logs.

    }

  }


  if (
    blockchainUpdateId ===
    null
  ) {

    throw new Error(
      "Transaction succeeded, but UpdateSubmitted event could not be read."
    );

  }


  // ===============================================
  // RESULT
  // ===============================================

  return {

    success: true,

    walletAddress:
      wallet.address,

    updateId,

    dataHash,

    metadata,

    blockchainUpdateId,

    transactionHash:
      transaction.hash,

    blockNumber:
      Number(
        receipt.blockNumber
      ),

    status:
      "BLOCKCHAIN_VERIFIED",

  };

}


// =====================================================
// VERIFY DIRECTLY THROUGH CONTRACT
// =====================================================

export async function verifyBlockchainUpdate(
  blockchainUpdateId,
  dataHash
) {

  const contract =
    getReadOnlyContract();


  const verified =
    await contract.verifyUpdate(

      blockchainUpdateId,

      dataHash

    );


  return Boolean(
    verified
  );

}


// =====================================================
// READ BLOCKCHAIN UPDATE
// =====================================================

export async function readBlockchainUpdate(
  blockchainUpdateId
) {

  const contract =
    getReadOnlyContract();


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
      update[5].toString(),

  };

}


// =====================================================
// SHORT ADDRESS
// =====================================================

export function shortenWalletAddress(
  address
) {

  if (!address) {

    return "";

  }


  if (
    address.length < 12
  ) {

    return address;

  }


  return (
    address.slice(0, 6) +
    "..." +
    address.slice(-4)
  );

}


// =====================================================
// FRIENDLY METAMASK ERRORS
// =====================================================

export function getMetaMaskErrorMessage(
  error
) {

  console.error(
    "MetaMask error:",
    error
  );


  if (!error) {

    return "Unknown MetaMask error.";

  }


  if (
    error.code === 4001 ||
    error.code ===
      "ACTION_REJECTED"
  ) {

    return "The transaction was rejected in MetaMask.";

  }


  if (
    error.code === -32002
  ) {

    return "A MetaMask request is already waiting. Open MetaMask to continue.";

  }


  if (
    error.shortMessage
  ) {

    return error.shortMessage;

  }


  if (
    error.reason
  ) {

    return error.reason;

  }


  if (
    error.message
  ) {

    return error.message;

  }


  return "MetaMask operation failed.";

}