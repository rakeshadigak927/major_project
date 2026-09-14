import { useEffect, useState } from "react";

import {
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiDatabase,
  FiUser,
  FiAward,
  FiShield,
  FiHash,
  FiBox,
  FiExternalLink,
} from "react-icons/fi";

import {
  getEvolutionHistory,
  verifyUpdate,
  getApiErrorMessage,
} from "../services/api";


function EvolutionHistory() {

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUpdate, setSelectedUpdate] =
    useState(null);

  const [verifyingId, setVerifyingId] =
    useState(null);

  const [verificationResults, setVerificationResults] =
    useState({});


  // =====================================================
  // LOAD HISTORY
  // =====================================================

  const loadHistory = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await getEvolutionHistory();

      if (response.success) {

        setHistory(
          response.data || []
        );

      } else {

        setError(
          response.message ||
          "Unable to retrieve evolution history."
        );

      }

    } catch (err) {

      console.error(
        "Evolution history error:",
        err
      );

      setError(
        getApiErrorMessage(err)
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadHistory();

  }, []);


  // =====================================================
  // VERIFY UPDATE
  // =====================================================

  const handleVerify = async (updateId) => {

    try {

      setVerifyingId(updateId);

      const response =
        await verifyUpdate(updateId);

      setVerificationResults(
        previous => ({
          ...previous,
          [updateId]: response,
        })
      );

    } catch (err) {

      console.error(
        "Verification failed:",
        err
      );

      setVerificationResults(
        previous => ({
          ...previous,

          [updateId]: {
            success: false,
            verified: false,
            integrity: "UNAVAILABLE",
            message:
              getApiErrorMessage(err),
          },

        })
      );

    } finally {

      setVerifyingId(null);

    }

  };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (timestamp) => {

    if (!timestamp) {
      return "Unknown time";
    }

    const date =
      new Date(timestamp);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return timestamp;

    }

    return date.toLocaleString();

  };


  // =====================================================
  // SHORTEN VALUE
  // =====================================================

  const shortenValue = (value) => {

    if (!value) {
      return "—";
    }

    const stringValue =
      String(value);

    if (stringValue.length <= 28) {
      return stringValue;
    }

    return (
      stringValue.slice(0, 12) +
      "..." +
      stringValue.slice(-10)
    );

  };


  // =====================================================
  // GET SOURCE
  // =====================================================

  const getSourceName = (item) => {

    return (
      item.source?.name ||
      item.source?.studentId ||
      "Unknown Source"
    );

  };


  // =====================================================
  // GET TARGET
  // =====================================================

  const getTargetName = (item) => {

    return (
      item.target?.name ||
      item.target?.certificateId ||
      "Unknown Target"
    );

  };


  // =====================================================
  // GET WALLET ADDRESS
  //
  // Supports slightly different backend property names
  // so older records do not break the page.
  // =====================================================

  const getWalletAddress = (item) => {

    return (
      item.blockchain?.walletAddress ||
      item.blockchain?.submitter ||
      item.walletAddress ||
      null
    );

  };


  // =====================================================
  // GET SIGNING METHOD
  // =====================================================

  const getSigningMethod = (item) => {

    const wallet =
      getWalletAddress(item);

    const storedMethod =
      item.blockchain?.signingMethod ||
      item.signingMethod;

    if (storedMethod) {

      return storedMethod;

    }

    if (wallet) {

      return "MetaMask";

    }

    return "Backend Wallet / Legacy";

  };


  // =====================================================
  // ETHERSCAN TRANSACTION URL
  // =====================================================

  const getTransactionUrl = (transactionHash) => {

    if (!transactionHash) {
      return null;
    }

    return (
      "https://sepolia.etherscan.io/tx/" +
      transactionHash
    );

  };


  // =====================================================
  // ETHERSCAN BLOCK URL
  // =====================================================

  const getBlockUrl = (blockNumber) => {

    if (
      blockNumber === null ||
      blockNumber === undefined ||
      blockNumber === ""
    ) {

      return null;

    }

    return (
      "https://sepolia.etherscan.io/block/" +
      blockNumber
    );

  };


  // =====================================================
  // ETHERSCAN ADDRESS URL
  // =====================================================

  const getAddressUrl = (address) => {

    if (!address) {
      return null;
    }

    return (
      "https://sepolia.etherscan.io/address/" +
      address
    );

  };


  // =====================================================
  // OPEN EXTERNAL LINK
  // =====================================================

  const openExternalLink = (url) => {

    if (!url) {
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="page-state">

        <FiRefreshCw
          className="spin-icon"
        />

        <h2>
          Loading Evolution History
        </h2>

        <p>
          Reading graph provenance
          records from Neo4j.
        </p>

      </div>

    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div className="page-state error-state">

        <FiAlertCircle />

        <h2>
          Unable to Load History
        </h2>

        <p>
          {error}
        </p>

        <button
          className="primary-button"
          onClick={loadHistory}
        >

          <FiRefreshCw />

          Try Again

        </button>

      </div>

    );

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="history-page">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            GRAPH PROVENANCE
          </p>

          <h1>
            Evolution History
          </h1>

          <p className="page-description">

            Track how the knowledge graph
            changes over time and inspect
            blockchain-backed provenance.

          </p>

        </div>


        <button
          className="secondary-button"
          onClick={loadHistory}
        >

          <FiRefreshCw />

          Refresh

        </button>

      </div>


      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      <div className="history-summary">

        <div>

          <FiClock />

          <span>
            Total Updates
          </span>

          <strong>
            {history.length}
          </strong>

        </div>


        <div>

          <FiShield />

          <span>
            Blockchain Verified
          </span>

          <strong>

            {
              history.filter(
                item =>
                  item.blockchain
                    ?.verified === true
              ).length
            }

          </strong>

        </div>


        <div>

          <FiDatabase />

          <span>
            Graph Evolution
          </span>

          <strong>
            Active
          </strong>

        </div>

      </div>


      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="evolution-layout">


        {/* =============================================== */}
        {/* TIMELINE */}
        {/* =============================================== */}

        <section className="timeline-panel">

          <div className="panel-header">

            <div>

              <h2>
                Evolution Timeline
              </h2>

              <p>
                Newest updates appear first
              </p>

            </div>

          </div>


          {history.length === 0 ? (

            <div className="empty-state">

              <FiClock />

              <h3>
                No evolution records
              </h3>

              <p>
                Add knowledge to create
                the first graph update.
              </p>

            </div>

          ) : (

            <div className="evolution-timeline">


              {history.map(
                (item, index) => {

                  const verified =
                    item.blockchain
                      ?.verified === true;

                  const verification =
                    verificationResults[
                      item.updateId
                    ];

                  const walletAddress =
                    getWalletAddress(item);

                  const signingMethod =
                    getSigningMethod(item);

                  const transactionUrl =
                    getTransactionUrl(
                      item.blockchain
                        ?.transactionHash
                    );


                  return (

                    <div
                      className="timeline-item"
                      key={item.updateId}
                    >


                      {/* TIMELINE MARKER */}

                      <div className="timeline-marker">

                        <div
                          className={
                            verified
                              ? "timeline-dot verified"
                              : "timeline-dot"
                          }
                        >

                          {
                            verified
                              ? (
                                <FiCheckCircle />
                              )
                              : (
                                <FiClock />
                              )
                          }

                        </div>


                        {
                          index <
                            history.length - 1
                          && (

                            <div
                              className="timeline-line"
                            />

                          )
                        }

                      </div>


                      {/* ================================= */}
                      {/* CARD */}
                      {/* ================================= */}

                      <div
                        className={
                          selectedUpdate
                            ?.updateId ===
                          item.updateId
                            ? "evolution-card selected"
                            : "evolution-card"
                        }
                        onClick={() =>
                          setSelectedUpdate(
                            item
                          )
                        }
                      >


                        <div className="evolution-card-header">

                          <div>

                            <span className="update-action">

                              {
                                item.action ||
                                "GRAPH_UPDATE"
                              }

                            </span>

                            <h3>

                              {
                                item.description ||
                                "Knowledge Graph Update"
                              }

                            </h3>

                          </div>


                          <span
                            className={
                              verified
                                ? "status-badge success"
                                : "status-badge pending"
                            }
                          >

                            {
                              verified
                                ? "Verified"
                                : item.blockchain
                                    ?.status ||
                                  "Not Anchored"
                            }

                          </span>

                        </div>


                        {/* =============================== */}
                        {/* RELATIONSHIP */}
                        {/* =============================== */}

                        <div className="evolution-path">

                          <div>

                            <FiUser />

                            <span>

                              {
                                getSourceName(
                                  item
                                )
                              }

                            </span>

                          </div>


                          <strong>

                            {
                              item.relationship ||
                              "RELATED_TO"
                            }

                            {" →"}

                          </strong>


                          <div>

                            <FiAward />

                            <span>

                              {
                                getTargetName(
                                  item
                                )
                              }

                            </span>

                          </div>

                        </div>


                        {/* =============================== */}
                        {/* META */}
                        {/* =============================== */}

                        <div className="evolution-meta">

                          <span>

                            <FiClock />

                            {
                              formatDate(
                                item.timestamp
                              )
                            }

                          </span>


                          <span>

                            Update:

                            {" "}

                            <code>
                              {item.updateId}
                            </code>

                          </span>

                        </div>


                        {/* =============================== */}
                        {/* BLOCKCHAIN MINI PROOF */}
                        {/* =============================== */}

                        {verified && (

                          <div className="mini-blockchain-proof">

                            <FiShield />


                            <span>

                              Block

                              {" "}

                              <strong>

                                {
                                  item.blockchain
                                    ?.blockNumber
                                }

                              </strong>

                            </span>


                            <span>

                              Blockchain ID

                              {" "}

                              <strong>

                                #
                                {
                                  item.blockchain
                                    ?.blockchainUpdateId
                                }

                              </strong>

                            </span>


                            <span>

                              Signed:

                              {" "}

                              <strong>
                                {signingMethod}
                              </strong>

                            </span>


                            {walletAddress && (

                              <span
                                title={
                                  walletAddress
                                }
                              >

                                Wallet:

                                {" "}

                                <strong>

                                  {
                                    shortenValue(
                                      walletAddress
                                    )
                                  }

                                </strong>

                              </span>

                            )}

                          </div>

                        )}


                        {/* =============================== */}
                        {/* ACTIONS */}
                        {/* =============================== */}

                        <div className="timeline-actions">


                          {item.blockchain
                            ?.blockchainUpdateId !=
                            null && (

                            <button
                              className="small-verify-button"
                              onClick={event => {

                                event.stopPropagation();

                                handleVerify(
                                  item.updateId
                                );

                              }}
                              disabled={
                                verifyingId ===
                                item.updateId
                              }
                            >

                              {
                                verifyingId ===
                                item.updateId
                                  ? (
                                    <>

                                      <FiRefreshCw
                                        className="spin-icon"
                                      />

                                      Verifying

                                    </>
                                  )
                                  : (
                                    <>

                                      <FiShield />

                                      Verify Integrity

                                    </>
                                  )
                              }

                            </button>

                          )}


                          {transactionUrl && (

                            <button
                              type="button"
                              className="small-verify-button"
                              onClick={event => {

                                event.stopPropagation();

                                openExternalLink(
                                  transactionUrl
                                );

                              }}
                            >

                              <FiExternalLink />

                              View Transaction

                            </button>

                          )}


                          {verification && (

                            <span
                              className={
                                verification
                                  .verified
                                  ? "verification-label valid"
                                  : "verification-label invalid"
                              }
                            >

                              {
                                verification
                                  .verified
                                  ? (
                                    <FiCheckCircle />
                                  )
                                  : (
                                    <FiAlertCircle />
                                  )
                              }

                              {
                                verification
                                  .integrity
                              }

                            </span>

                          )}


                        </div>


                      </div>

                    </div>

                  );

                }
              )}


            </div>

          )}

        </section>


        {/* =============================================== */}
        {/* DETAILS PANEL */}
        {/* =============================================== */}

        <aside className="evolution-details">

          <div className="panel-header">

            <div>

              <h2>
                Update Details
              </h2>

              <p>
                Provenance and blockchain proof
              </p>

            </div>

          </div>


          {!selectedUpdate ? (

            <div className="node-empty-state">

              <FiClock />

              <h3>
                Select an Update
              </h3>

              <p>

                Click an evolution record
                to inspect its details.

              </p>

            </div>

          ) : (

            <div className="update-detail-content">


              {/* ========================================= */}
              {/* STATUS */}
              {/* ========================================= */}

              <div className="detail-status">

                {
                  selectedUpdate
                    .blockchain
                    ?.verified
                    ? (
                      <FiCheckCircle />
                    )
                    : (
                      <FiClock />
                    )
                }


                <div>

                  <strong>

                    {
                      selectedUpdate
                        .blockchain
                        ?.verified
                        ? "Blockchain Verified"
                        : "Not Blockchain Verified"
                    }

                  </strong>


                  <span>

                    {
                      selectedUpdate
                        .blockchain
                        ?.status ||
                      "NOT_ANCHORED"
                    }

                  </span>

                </div>

              </div>


              {/* ========================================= */}
              {/* GRAPH CHANGE */}
              {/* ========================================= */}

              <div className="detail-section">

                <h3>
                  Graph Change
                </h3>


                <div className="detail-row">

                  <span>
                    Update ID
                  </span>

                  <code>

                    {
                      selectedUpdate
                        .updateId
                    }

                  </code>

                </div>


                <div className="detail-row">

                  <span>
                    Action
                  </span>

                  <strong>

                    {
                      selectedUpdate
                        .action ||
                      "—"
                    }

                  </strong>

                </div>


                <div className="detail-row">

                  <span>
                    Relationship
                  </span>

                  <strong>

                    {
                      selectedUpdate
                        .relationship ||
                      "—"
                    }

                  </strong>

                </div>

              </div>


              {/* ========================================= */}
              {/* PROVENANCE */}
              {/* ========================================= */}

              <div className="detail-section">

                <h3>
                  Provenance
                </h3>


                <div className="detail-row">

                  <span>
                    Actor
                  </span>

                  <strong>

                    {
                      selectedUpdate
                        .provenance
                        ?.name ||
                      "Unknown"
                    }

                  </strong>

                </div>


                <div className="detail-row">

                  <span>
                    Actor ID
                  </span>

                  <strong>

                    {
                      selectedUpdate
                        .provenance
                        ?.actorId ||
                      "—"
                    }

                  </strong>

                </div>


                <div className="detail-row">

                  <span>
                    Role
                  </span>

                  <strong>

                    {
                      selectedUpdate
                        .provenance
                        ?.role ||
                      "—"
                    }

                  </strong>

                </div>

              </div>


              {/* ========================================= */}
              {/* BLOCKCHAIN PROOF */}
              {/* ========================================= */}

              <div className="detail-section">

                <h3>
                  Blockchain Proof
                </h3>


                {/* SIGNING METHOD */}

                <div className="detail-row">

                  <span>
                    Signing Method
                  </span>

                  <strong>

                    {
                      getSigningMethod(
                        selectedUpdate
                      )
                    }

                  </strong>

                </div>


                {/* WALLET ADDRESS */}

                <div className="detail-row vertical">

                  <span>
                    Wallet Address
                  </span>


                  {
                    getWalletAddress(
                      selectedUpdate
                    )
                      ? (

                        <code
                          title={
                            getWalletAddress(
                              selectedUpdate
                            )
                          }
                        >

                          {
                            shortenValue(
                              getWalletAddress(
                                selectedUpdate
                              )
                            )
                          }

                        </code>

                      )
                      : (

                        <strong>
                          —
                        </strong>

                      )
                  }

                </div>


                {/* BLOCKCHAIN ID */}

                <div className="detail-row">

                  <span>
                    Blockchain ID
                  </span>

                  <strong>

                    {
                      selectedUpdate
                        .blockchain
                        ?.blockchainUpdateId !=
                      null
                        ? `#${
                            selectedUpdate
                              .blockchain
                              .blockchainUpdateId
                          }`
                        : "—"
                    }

                  </strong>

                </div>


                {/* BLOCK */}

                <div className="detail-row">

                  <span>
                    Block
                  </span>

                  <strong>

                    {
                      selectedUpdate
                        .blockchain
                        ?.blockNumber ??
                      "—"
                    }

                  </strong>

                </div>


                {/* DATA HASH */}

                <div className="detail-row vertical">

                  <span>

                    <FiHash />

                    Data Hash

                  </span>


                  <code
                    title={
                      selectedUpdate
                        .blockchain
                        ?.dataHash
                    }
                  >

                    {
                      shortenValue(
                        selectedUpdate
                          .blockchain
                          ?.dataHash
                      )
                    }

                  </code>

                </div>


                {/* TRANSACTION HASH */}

                <div className="detail-row vertical">

                  <span>

                    <FiBox />

                    Transaction

                  </span>


                  <code
                    title={
                      selectedUpdate
                        .blockchain
                        ?.transactionHash
                    }
                  >

                    {
                      shortenValue(
                        selectedUpdate
                          .blockchain
                          ?.transactionHash
                      )
                    }

                  </code>

                </div>


                {/* ======================================= */}
                {/* ETHERSCAN ACTIONS */}
                {/* ======================================= */}

                {
                  selectedUpdate
                    .blockchain
                    ?.transactionHash && (

                    <button
                      type="button"
                      className="small-verify-button"
                      onClick={() =>
                        openExternalLink(
                          getTransactionUrl(
                            selectedUpdate
                              .blockchain
                              .transactionHash
                          )
                        )
                      }
                    >

                      <FiExternalLink />

                      View Transaction on Etherscan

                    </button>

                  )
                }


                {
                  selectedUpdate
                    .blockchain
                    ?.blockNumber !=
                    null && (

                    <button
                      type="button"
                      className="small-verify-button"
                      onClick={() =>
                        openExternalLink(
                          getBlockUrl(
                            selectedUpdate
                              .blockchain
                              .blockNumber
                          )
                        )
                      }
                    >

                      <FiExternalLink />

                      View Block on Etherscan

                    </button>

                  )
                }


                {
                  getWalletAddress(
                    selectedUpdate
                  ) && (

                    <button
                      type="button"
                      className="small-verify-button"
                      onClick={() =>
                        openExternalLink(
                          getAddressUrl(
                            getWalletAddress(
                              selectedUpdate
                            )
                          )
                        )
                      }
                    >

                      <FiExternalLink />

                      View Wallet on Etherscan

                    </button>

                  )
                }


              </div>


              {/* ========================================= */}
              {/* VERIFY SELECTED UPDATE */}
              {/* ========================================= */}

              {
                selectedUpdate
                  .blockchain
                  ?.blockchainUpdateId !=
                  null && (

                  <div className="detail-section">

                    <button
                      className="verify-button"
                      onClick={() =>
                        handleVerify(
                          selectedUpdate
                            .updateId
                        )
                      }
                      disabled={
                        verifyingId ===
                        selectedUpdate
                          .updateId
                      }
                    >

                      {
                        verifyingId ===
                        selectedUpdate
                          .updateId
                          ? (
                            <>

                              <FiRefreshCw
                                className="spin-icon"
                              />

                              Verifying...

                            </>
                          )
                          : (
                            <>

                              <FiShield />

                              Verify Integrity
                              Against Blockchain

                            </>
                          )
                      }

                    </button>


                    {
                      verificationResults[
                        selectedUpdate
                          .updateId
                      ] && (

                        <div
                          className={
                            verificationResults[
                              selectedUpdate
                                .updateId
                            ].verified
                              ? "verification-result valid"
                              : "verification-result invalid"
                          }
                        >

                          {
                            verificationResults[
                              selectedUpdate
                                .updateId
                            ].verified
                              ? (
                                <FiCheckCircle />
                              )
                              : (
                                <FiAlertCircle />
                              )
                          }


                          <div>

                            <strong>

                              {
                                verificationResults[
                                  selectedUpdate
                                    .updateId
                                ].verified
                                  ? "Integrity Valid"
                                  : "Integrity Invalid"
                              }

                            </strong>


                            <p>

                              {
                                verificationResults[
                                  selectedUpdate
                                    .updateId
                                ].integrity ||
                                verificationResults[
                                  selectedUpdate
                                    .updateId
                                ].message
                              }

                            </p>

                          </div>

                        </div>

                      )
                    }

                  </div>

                )
              }


            </div>

          )}

        </aside>


      </div>


    </div>

  );

}


export default EvolutionHistory;