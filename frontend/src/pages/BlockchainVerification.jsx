import { useEffect, useState } from "react";

import {
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiRefreshCw,
  FiBox,
  FiHash,
  FiDatabase,
  FiActivity,
} from "react-icons/fi";

import {
  verifyUpdate,
  getBlockchainStatus,
  getEvolutionHistory,
  getApiErrorMessage,
} from "../services/api";


function BlockchainVerification() {

  // =====================================================
  // STATE
  // =====================================================

  const [updateId, setUpdateId] =
    useState("");

  const [verification, setVerification] =
    useState(null);

  const [blockchain, setBlockchain] =
    useState(null);

  const [recentUpdates, setRecentUpdates] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // INITIAL DATA
  // =====================================================

  const loadPageData = async () => {

    try {

      setPageLoading(true);
      setError("");


      const [
        blockchainResponse,
        historyResponse,
      ] = await Promise.all([
        getBlockchainStatus(),
        getEvolutionHistory(),
      ]);


      if (blockchainResponse.success) {

        setBlockchain(
          blockchainResponse
        );

      }


      if (historyResponse.success) {

        const verifiedUpdates =
          (historyResponse.data || [])
            .filter(
              item =>
                item.blockchain
                  ?.blockchainUpdateId !=
                null
            )
            .slice(0, 5);


        setRecentUpdates(
          verifiedUpdates
        );


        if (
          verifiedUpdates.length > 0
        ) {

          setUpdateId(
            verifiedUpdates[0]
              .updateId
          );

        }

      }


    } catch (err) {

      console.error(
        "Verification page error:",
        err
      );


      setError(
        getApiErrorMessage(err)
      );


    } finally {

      setPageLoading(false);

    }

  };


  useEffect(() => {

    loadPageData();

  }, []);


  // =====================================================
  // VERIFY
  // =====================================================

  const handleVerify = async (
    event
  ) => {

    if (event) {
      event.preventDefault();
    }


    if (!updateId.trim()) {

      setError(
        "Please enter a graph update ID."
      );

      return;

    }


    try {

      setLoading(true);
      setError("");
      setVerification(null);


      const response =
        await verifyUpdate(
          updateId.trim()
        );


      setVerification(
        response
      );


    } catch (err) {

      console.error(
        "Blockchain verification error:",
        err
      );


      setError(
        getApiErrorMessage(err)
      );


    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // SELECT RECENT UPDATE
  // =====================================================

  const selectUpdate = (
    id
  ) => {

    setUpdateId(id);

    setVerification(null);

    setError("");

  };


  // =====================================================
  // SHORT HASH
  // =====================================================

  const shortenHash = (
    value
  ) => {

    if (!value) {
      return "—";
    }


    if (value.length <= 30) {
      return value;
    }


    return (
      value.slice(0, 14) +
      "..." +
      value.slice(-12)
    );

  };


  // =====================================================
  // PAGE LOADING
  // =====================================================

  if (pageLoading) {

    return (

      <div className="page-state">

        <FiRefreshCw
          className="spin-icon"
        />

        <h2>
          Connecting to Blockchain
        </h2>

        <p>
          Reading smart contract
          and graph records.
        </p>

      </div>

    );

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="verification-page">


      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            BLOCKCHAIN INTEGRITY
          </p>

          <h1>
            Blockchain Verification
          </h1>

          <p className="page-description">

            Verify whether a knowledge
            graph evolution record matches
            the cryptographic proof stored
            on Ethereum Sepolia.

          </p>

        </div>


        <div className="header-security">

          <FiShield />

          <div>

            <strong>
              Integrity Verification
            </strong>

            <span>
              Smart Contract Proof
            </span>

          </div>

        </div>

      </div>


      {/* ============================================= */}
      {/* NETWORK STATUS */}
      {/* ============================================= */}

      <div className="verification-network-card">


        <div className="network-main">

          <div className="network-icon">

            <FiBox />

          </div>


          <div>

            <span>
              BLOCKCHAIN NETWORK
            </span>

            <h3>

              {
                blockchain?.network ||
                "Ethereum Sepolia"
              }

            </h3>

          </div>

        </div>


        <div className="network-detail">

          <span>
            Smart Contract
          </span>

          <code
            title={
              blockchain?.contract
            }
          >

            {
              shortenHash(
                blockchain?.contract
              )
            }

          </code>

        </div>


        <div className="network-detail">

          <span>
            Blockchain Records
          </span>

          <strong>

            {
              blockchain
                ?.totalBlockchainUpdates ??
              0
            }

          </strong>

        </div>


        <div className="network-connected">

          <span className="status-dot">
          </span>

          Connected

        </div>


      </div>


      {/* ============================================= */}
      {/* MAIN GRID */}
      {/* ============================================= */}

      <div className="verification-grid">


        {/* =========================================== */}
        {/* VERIFY FORM */}
        {/* =========================================== */}

        <section className="verification-form-panel">


          <div className="panel-header">

            <div>

              <h2>
                Verify Graph Update
              </h2>

              <p>
                Enter an evolution
                update identifier
              </p>

            </div>


            <FiSearch />

          </div>


          <form
            onSubmit={
              handleVerify
            }
            className="verification-form"
          >


            <div className="form-group">

              <label>
                Graph Update ID
              </label>


              <div className="verification-input">

                <FiDatabase />

                <input
                  type="text"
                  value={
                    updateId
                  }
                  onChange={
                    event => {

                      setUpdateId(
                        event.target.value
                      );

                      setVerification(
                        null
                      );

                      setError("");

                    }
                  }
                  placeholder="UPD-..."
                  autoComplete="off"
                />

              </div>


              <small>

                Use an update that
                has already been
                anchored on blockchain.

              </small>

            </div>


            <button
              type="submit"
              className="verify-main-button"
              disabled={
                loading
              }
            >

              {loading ? (

                <>

                  <FiRefreshCw
                    className="spin-icon"
                  />

                  Checking Blockchain...

                </>

              ) : (

                <>

                  <FiShield />

                  Verify Integrity

                </>

              )}

            </button>


          </form>


          {/* ERROR */}

          {error && (

            <div className="alert-box error">

              <FiAlertCircle />

              <div>

                <strong>
                  Verification Failed
                </strong>

                <p>
                  {error}
                </p>

              </div>

            </div>

          )}


          {/* RECENT */}

          <div className="recent-verification">

            <h3>
              Recent Blockchain Updates
            </h3>


            {recentUpdates.length === 0 ? (

              <p className="muted-text">
                No blockchain-backed
                updates available.
              </p>

            ) : (

              <div className="recent-update-list">

                {recentUpdates.map(
                  item => (

                    <button
                      type="button"
                      key={
                        item.updateId
                      }
                      className={
                        updateId ===
                        item.updateId
                          ? "recent-update selected"
                          : "recent-update"
                      }
                      onClick={() =>
                        selectUpdate(
                          item.updateId
                        )
                      }
                    >

                      <div>

                        <FiCheckCircle />

                        <span>

                          {
                            item.updateId
                          }

                        </span>

                      </div>


                      <small>

                        Block

                        {" "}

                        {
                          item.blockchain
                            ?.blockNumber
                        }

                      </small>

                    </button>

                  )
                )}

              </div>

            )}

          </div>


        </section>


        {/* =========================================== */}
        {/* VERIFICATION RESULT */}
        {/* =========================================== */}

        <section className="verification-result-panel">


          <div className="panel-header">

            <div>

              <h2>
                Integrity Result
              </h2>

              <p>
                On-chain comparison
              </p>

            </div>


            <FiShield />

          </div>


          {!verification ? (

            <div className="verification-empty">

              <div className="verification-shield">

                <FiShield />

              </div>


              <h3>
                Ready to Verify
              </h3>


              <p>

                Select or enter a graph
                update ID and compare its
                Neo4j proof with the
                smart contract record.

              </p>


              <div className="verification-process">


                <div>

                  <FiDatabase />

                  <span>
                    Neo4j Hash
                  </span>

                </div>


                <strong>
                  ⇄
                </strong>


                <div>

                  <FiBox />

                  <span>
                    Blockchain Hash
                  </span>

                </div>


              </div>

            </div>

          ) : (

            <div className="verification-output">


              {/* STATUS */}

              <div
                className={
                  verification.verified
                    ? "integrity-hero valid"
                    : "integrity-hero invalid"
                }
              >

                {
                  verification.verified
                    ? (
                      <FiCheckCircle />
                    )
                    : (
                      <FiAlertCircle />
                    )
                }


                <div>

                  <span>
                    INTEGRITY STATUS
                  </span>

                  <h2>

                    {
                      verification
                        .integrity ||
                      (
                        verification
                          .verified
                          ? "VALID"
                          : "INVALID"
                      )
                    }

                  </h2>


                  <p>

                    {
                      verification
                        .verified
                        ? "The graph record matches the blockchain proof."
                        : "The graph record does not match the blockchain proof."
                    }

                  </p>

                </div>

              </div>


              {/* DETAILS */}

              <div className="verification-proof-details">


                <div className="proof-detail">

                  <span>
                    Graph Update
                  </span>

                  <code>

                    {
                      verification
                        .updateId
                    }

                  </code>

                </div>


                <div className="proof-detail">

                  <span>
                    Blockchain Update ID
                  </span>

                  <strong>

                    #
                    {
                      verification
                        .blockchainUpdateId
                    }

                  </strong>

                </div>


                <div className="proof-detail">

                  <span>
                    Graph Status
                  </span>

                  <strong>

                    {
                      verification
                        .status ||
                      "—"
                    }

                  </strong>

                </div>


                <div className="proof-detail vertical">

                  <span>

                    <FiHash />

                    Transaction Hash

                  </span>

                  <code
                    title={
                      verification
                        .transactionHash
                    }
                  >

                    {
                      shortenHash(
                        verification
                          .transactionHash
                      )
                    }

                  </code>

                </div>


              </div>


              {/* EXPLANATION */}

              {verification.verified && (

                <div className="integrity-explanation">

                  <FiCheckCircle />


                  <div>

                    <strong>
                      Cryptographic integrity confirmed
                    </strong>


                    <p>

                      The hash associated
                      with this knowledge
                      graph update matches
                      the immutable record
                      stored by the smart
                      contract.

                    </p>

                  </div>

                </div>

              )}


            </div>

          )}


        </section>


      </div>


      {/* ============================================= */}
      {/* VERIFICATION CONCEPT */}
      {/* ============================================= */}

      <section className="verification-concept">


        <div className="panel-header">

          <div>

            <h2>
              How Verification Works
            </h2>

            <p>
              Integrity checking architecture
            </p>

          </div>


          <FiActivity />

        </div>


        <div className="concept-flow">


          <div className="concept-step">

            <FiDatabase />

            <strong>
              1. Graph Record
            </strong>

            <p>
              Retrieve evolution
              proof from Neo4j.
            </p>

          </div>


          <span>
            →
          </span>


          <div className="concept-step">

            <FiHash />

            <strong>
              2. Stored Hash
            </strong>

            <p>
              Read the SHA-256
              fingerprint.
            </p>

          </div>


          <span>
            →
          </span>


          <div className="concept-step">

            <FiBox />

            <strong>
              3. Smart Contract
            </strong>

            <p>
              Retrieve the immutable
              blockchain record.
            </p>

          </div>


          <span>
            →
          </span>


          <div className="concept-step">

            <FiShield />

            <strong>
              4. Compare
            </strong>

            <p>
              Confirm whether both
              proofs match.
            </p>

          </div>


          <span>
            →
          </span>


          <div className="concept-step">

            <FiCheckCircle />

            <strong>
              5. Integrity
            </strong>

            <p>
              Return VALID or
              INVALID.
            </p>

          </div>


        </div>


      </section>


    </div>

  );

}


export default BlockchainVerification;