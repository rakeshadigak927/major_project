import { useEffect, useState } from "react";

import {
  FiUsers,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiUserCheck,
  FiUserX,
  FiExternalLink,
  FiHash,
} from "react-icons/fi";

import {
  connectMetaMask,
  checkAuthorization,
  isWalletAdmin,
  authorizeProviderWithMetaMask,
  revokeProviderWithMetaMask,
  shortenWalletAddress,
  getMetaMaskErrorMessage,
} from "../services/metamask";


// =====================================================
// PROVIDER MANAGEMENT
// =====================================================

function ProviderManagement() {

  // ===================================================
  // STATE
  // ===================================================

  const [walletAddress, setWalletAddress] =
    useState("");

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [providerAddress, setProviderAddress] =
    useState("");

  const [providerAuthorized, setProviderAuthorized] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [transaction, setTransaction] =
    useState(null);


  // ===================================================
  // LOAD WALLET + ADMIN STATUS
  // ===================================================

  const loadAdminInformation = async () => {

    try {

      setLoading(true);

      setError("");

      setSuccess("");


      // -----------------------------------------------
      // CONNECT CURRENT METAMASK WALLET
      // -----------------------------------------------

      const wallet =
        await connectMetaMask();


      setWalletAddress(
        wallet.address
      );


      // -----------------------------------------------
      // CHECK WHETHER CURRENT WALLET IS ADMIN
      // -----------------------------------------------

      const adminStatus =
        await isWalletAdmin(
          wallet.address
        );


      setIsAdmin(
        adminStatus
      );


    } catch (err) {

      console.error(
        "Provider management load error:",
        err
      );


      setError(
        getMetaMaskErrorMessage(
          err
        )
      );


      setWalletAddress("");

      setIsAdmin(false);


    } finally {

      setLoading(false);

    }

  };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadAdminInformation();

  }, []);


  // ===================================================
  // METAMASK EVENTS
  // ===================================================

  useEffect(() => {

    if (!window.ethereum) {

      return;

    }


    const handleAccountsChanged = () => {

      setProviderAddress("");

      setProviderAuthorized(null);

      setTransaction(null);

      setSuccess("");

      setError("");

      loadAdminInformation();

    };


    const handleChainChanged = () => {

      setProviderAddress("");

      setProviderAuthorized(null);

      setTransaction(null);

      setSuccess("");

      setError("");

      loadAdminInformation();

    };


    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );


    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );


    return () => {

      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );


      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );

    };

  }, []);


  // ===================================================
  // CHECK PROVIDER
  // ===================================================

  const handleCheckProvider = async () => {

    const address =
      providerAddress.trim();


    if (!address) {

      setError(
        "Enter a provider wallet address."
      );

      return;

    }


    try {

      setChecking(true);

      setError("");

      setSuccess("");

      setTransaction(null);


      const authorized =
        await checkAuthorization(
          address
        );


      setProviderAuthorized(
        authorized
      );


    } catch (err) {

      console.error(
        "Provider check error:",
        err
      );


      setProviderAuthorized(null);


      setError(
        getMetaMaskErrorMessage(
          err
        )
      );


    } finally {

      setChecking(false);

    }

  };


  // ===================================================
  // AUTHORIZE PROVIDER
  // ===================================================

  const handleAuthorize = async () => {

    const address =
      providerAddress.trim();


    if (!address) {

      setError(
        "Enter a provider wallet address."
      );

      return;

    }


    if (!isAdmin) {

      setError(
        "Administrator access is required."
      );

      return;

    }


    try {

      setProcessing(true);

      setError("");

      setSuccess("");

      setTransaction(null);


      const result =
        await authorizeProviderWithMetaMask(
          address
        );


      setProviderAuthorized(
        true
      );


      setTransaction(
        result
      );


      setSuccess(
        "Provider successfully authorized on Ethereum Sepolia."
      );


    } catch (err) {

      console.error(
        "Authorize provider error:",
        err
      );


      setError(
        getMetaMaskErrorMessage(
          err
        )
      );


    } finally {

      setProcessing(false);

    }

  };


  // ===================================================
  // REVOKE PROVIDER
  // ===================================================

  const handleRevoke = async () => {

    const address =
      providerAddress.trim();


    if (!address) {

      setError(
        "Enter a provider wallet address."
      );

      return;

    }


    if (!isAdmin) {

      setError(
        "Administrator access is required."
      );

      return;

    }


    try {

      setProcessing(true);

      setError("");

      setSuccess("");

      setTransaction(null);


      const result =
        await revokeProviderWithMetaMask(
          address
        );


      setProviderAuthorized(
        false
      );


      setTransaction(
        result
      );


      setSuccess(
        "Provider authorization successfully revoked."
      );


    } catch (err) {

      console.error(
        "Revoke provider error:",
        err
      );


      setError(
        getMetaMaskErrorMessage(
          err
        )
      );


    } finally {

      setProcessing(false);

    }

  };


  // ===================================================
  // OPEN ETHERSCAN
  // ===================================================

  const openTransaction = () => {

    if (
      !transaction?.transactionHash
    ) {

      return;

    }


    window.open(

      `https://sepolia.etherscan.io/tx/${transaction.transactionHash}`,

      "_blank",

      "noopener,noreferrer"

    );

  };


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (

      <div className="page-state">

        <FiRefreshCw
          className="spin-icon"
        />

        <h2>
          Checking Wallet Access
        </h2>

        <p>
          Verifying administrator privileges
          with the smart contract.
        </p>

      </div>

    );

  }


  // ===================================================
  // UI
  // ===================================================

  return (

    <div className="provider-management-page">


      {/* =============================================== */}
      {/* HEADER */}
      {/* =============================================== */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            SMART CONTRACT ADMINISTRATION
          </p>


          <h1>
            Provider Management
          </h1>


          <p className="page-description">
            Manage Ethereum wallets permitted to
            submit knowledge graph updates.
          </p>

        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            loadAdminInformation
          }
          disabled={
            processing
          }
        >

          <FiRefreshCw />

          Refresh

        </button>

      </div>


      {/* =============================================== */}
      {/* WALLET SUMMARY */}
      {/* =============================================== */}

      <div className="history-summary">


        {/* CONNECTED WALLET */}

        <div>

          <FiUsers />

          <span>
            Connected Wallet
          </span>

          <strong
            title={
              walletAddress
            }
          >

            {
              walletAddress
                ? shortenWalletAddress(
                    walletAddress
                  )
                : "Not Connected"
            }

          </strong>

        </div>


        {/* WALLET ROLE */}

        <div>

          <FiShield />

          <span>
            Wallet Role
          </span>

          <strong>

            {
              isAdmin
                ? "Administrator"
                : "Standard Wallet"
            }

          </strong>

        </div>


        {/* ACCESS */}

        <div>

          {
            isAdmin
              ? <FiCheckCircle />
              : <FiAlertCircle />
          }

          <span>
            Admin Access
          </span>

          <strong>

            {
              isAdmin
                ? "Granted"
                : "Denied"
            }

          </strong>

        </div>

      </div>


      {/* =============================================== */}
      {/* ERROR */}
      {/* =============================================== */}

      {error && (

        <div className="alert-box error">

          <FiAlertCircle />


          <div>

            <strong>
              Operation Failed
            </strong>

            <p>
              {error}
            </p>

          </div>

        </div>

      )}


      {/* =============================================== */}
      {/* SUCCESS */}
      {/* =============================================== */}

      {success && (

        <div className="alert-box success">

          <FiCheckCircle />


          <div>

            <strong>
              Blockchain Updated
            </strong>

            <p>
              {success}
            </p>

          </div>

        </div>

      )}


      {/* =============================================== */}
      {/* NON-ADMIN */}
      {/* =============================================== */}

      {!isAdmin && (

        <section className="form-panel">

          <div className="panel-header">

            <div>

              <h2>
                Administrator Access Required
              </h2>

              <p>
                Provider management is restricted.
              </p>

            </div>

            <FiShield />

          </div>


          <div className="proof-placeholder">

            <FiAlertCircle />

            <h3>
              Access Denied
            </h3>

            <p>
              The connected wallet does not have
              administrator privileges for provider
              management.
            </p>

          </div>

        </section>

      )}


      {/* =============================================== */}
      {/* ADMIN ONLY */}
      {/* =============================================== */}

      {isAdmin && (

        <div className="add-knowledge-grid">


          {/* =========================================== */}
          {/* PROVIDER FORM */}
          {/* =========================================== */}

          <section className="form-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Manage Provider
                </h2>

                <p>
                  Enter an Ethereum wallet address
                  to manage its authorization.
                </p>

              </div>

              <FiUsers />

            </div>


            <div className="knowledge-form">


              {/* PROVIDER ADDRESS */}

              <div className="form-group">

                <label>

                  <FiHash />

                  Provider Wallet Address

                </label>


                <input
                  type="text"
                  value={
                    providerAddress
                  }
                  onChange={
                    event => {

                      setProviderAddress(
                        event.target.value
                      );

                      setProviderAuthorized(
                        null
                      );

                      setSuccess("");

                      setError("");

                      setTransaction(
                        null
                      );

                    }
                  }
                  placeholder="0x..."
                  disabled={
                    processing
                  }
                />

              </div>


              {/* CHECK BUTTON */}

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleCheckProvider
                }
                disabled={
                  checking ||
                  processing ||
                  !providerAddress.trim()
                }
              >

                {
                  checking
                    ? (
                      <>

                        <FiRefreshCw
                          className="spin-icon"
                        />

                        Checking...

                      </>
                    )
                    : (
                      <>

                        <FiShield />

                        Check Authorization

                      </>
                    )
                }

              </button>


              {/* ======================================= */}
              {/* PROVIDER STATUS */}
              {/* ======================================= */}

              {
                providerAuthorized !== null && (

                  <div
                    className={
                      providerAuthorized
                        ? "verification-result valid"
                        : "verification-result invalid"
                    }
                  >

                    {
                      providerAuthorized
                        ? <FiCheckCircle />
                        : <FiAlertCircle />
                    }


                    <div>

                      <strong>

                        {
                          providerAuthorized
                            ? "Authorized Provider"
                            : "Not Authorized"
                        }

                      </strong>


                      <p>

                        {
                          providerAuthorized
                            ? "This wallet can submit knowledge graph updates."
                            : "This wallet cannot submit knowledge graph updates."
                        }

                      </p>

                    </div>

                  </div>

                )
              }


              {/* ======================================= */}
              {/* ACTIONS */}
              {/* ======================================= */}

              <div className="form-actions">


                {/* REVOKE */}

                <button
                  type="button"
                  className="danger-button"
                  onClick={
                    handleRevoke
                  }
                  disabled={
                    processing ||
                    !providerAddress.trim() ||
                    providerAuthorized === false
                  }
                >

                  {
                    processing
                      ? (
                        <FiRefreshCw
                          className="spin-icon"
                        />
                      )
                      : (
                        <FiUserX />
                      )
                  }

                  Revoke Provider

                </button>


                {/* AUTHORIZE */}

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    handleAuthorize
                  }
                  disabled={
                    processing ||
                    !providerAddress.trim() ||
                    providerAuthorized === true
                  }
                >

                  {
                    processing
                      ? (
                        <>

                          <FiRefreshCw
                            className="spin-icon"
                          />

                          Waiting for MetaMask...

                        </>
                      )
                      : (
                        <>

                          <FiUserCheck />

                          Authorize Provider

                        </>
                      )
                  }

                </button>


              </div>

            </div>

          </section>


          {/* =========================================== */}
          {/* BLOCKCHAIN PROOF */}
          {/* =========================================== */}

          <section className="proof-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Authorization Proof
                </h2>

                <p>
                  Ethereum Sepolia transaction
                  information
                </p>

              </div>

              <FiShield />

            </div>


            {!transaction ? (

              <div className="proof-placeholder">

                <FiShield />

                <h3>
                  No Admin Transaction
                </h3>

                <p>
                  Authorize or revoke a provider
                  to create an on-chain
                  administration transaction.
                </p>

              </div>

            ) : (

              <div className="proof-result">


                {/* SUCCESS */}

                <div className="success-banner">

                  <FiCheckCircle />


                  <div>

                    <h3>

                      {
                        transaction.action ===
                        "AUTHORIZED"
                          ? "Provider Authorized"
                          : "Provider Revoked"
                      }

                    </h3>


                    <p>
                      Smart contract provider
                      permissions were updated
                      successfully.
                    </p>

                  </div>

                </div>


                {/* ===================================== */}
                {/* ADMINISTRATION PROOF */}
                {/* ===================================== */}

                <div className="proof-section">

                  <h3>
                    Administration Proof
                  </h3>


                  <div className="proof-data-row">

                    <span>
                      Action
                    </span>

                    <strong>
                      {transaction.action}
                    </strong>

                  </div>


                  <div className="proof-data-row vertical">

                    <span>
                      Provider Wallet
                    </span>

                    <code>
                      {transaction.providerAddress}
                    </code>

                  </div>


                  <div className="proof-data-row vertical">

                    <span>
                      Admin Signer
                    </span>

                    <code>
                      {transaction.adminAddress}
                    </code>

                  </div>


                  <div className="proof-data-row">

                    <span>
                      Network
                    </span>

                    <strong>
                      Ethereum Sepolia
                    </strong>

                  </div>


                  <div className="proof-data-row">

                    <span>
                      Block Number
                    </span>

                    <strong>
                      {transaction.blockNumber}
                    </strong>

                  </div>


                  <div className="proof-data-row vertical">

                    <span>
                      Transaction Hash
                    </span>

                    <code>
                      {transaction.transactionHash}
                    </code>

                  </div>

                </div>


                {/* ===================================== */}
                {/* ETHERSCAN */}
                {/* ===================================== */}

                <button
                  type="button"
                  className="verify-button"
                  onClick={
                    openTransaction
                  }
                >

                  <FiExternalLink />

                  View Transaction on Etherscan

                </button>


              </div>

            )}

          </section>

        </div>

      )}

    </div>

  );

}


export default ProviderManagement;