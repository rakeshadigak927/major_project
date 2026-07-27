import { useEffect, useState } from "react";
import {
  FiDatabase,
  FiShare2,
  FiActivity,
  FiShield,
  FiBox,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import {
  getStatistics,
  getBlockchainStatus,
  getEvolutionHistory,
  getApiErrorMessage,
} from "../services/api";


function Dashboard() {

  const [stats, setStats] = useState({
    totalNodes: 0,
    totalRelationships: 0,
    graphUpdates: 0,
    blockchainVerified: 0,
    blockchainRecords: 0,
  });

  const [blockchain, setBlockchain] = useState(null);

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {

    try {

      setLoading(true);
      setError("");


      const [
        statisticsResponse,
        blockchainResponse,
        historyResponse,
      ] = await Promise.all([
        getStatistics(),
        getBlockchainStatus(),
        getEvolutionHistory(),
      ]);


      if (statisticsResponse.success) {
        setStats(statisticsResponse.data);
      }


      if (blockchainResponse.success) {
        setBlockchain(blockchainResponse);
      }


      if (historyResponse.success) {
        setHistory(
          historyResponse.data.slice(0, 5)
        );
      }


    } catch (err) {

      console.error(
        "Dashboard loading error:",
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

    loadDashboard();

  }, []);


  // =====================================================
  // SHORTEN HASH
  // =====================================================

  const shortenHash = (hash) => {

    if (!hash) {
      return "Not available";
    }

    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <div className="page-state">

        <FiRefreshCw className="spin-icon" />

        <h2>Loading dashboard...</h2>

        <p>
          Reading Neo4j and blockchain data.
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

        <h2>Unable to load dashboard</h2>

        <p>{error}</p>

        <button
          className="primary-button"
          onClick={loadDashboard}
        >
          Try Again
        </button>

      </div>
    );

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="dashboard-page">

      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            DECENTRALIZED KNOWLEDGE GRAPH
          </p>

          <h1>
            Knowledge Graph Dashboard
          </h1>

          <p className="page-description">
            Monitor graph evolution, provenance,
            blockchain anchoring and integrity
            verification.
          </p>

        </div>


        <button
          className="secondary-button"
          onClick={loadDashboard}
        >

          <FiRefreshCw />

          Refresh

        </button>

      </div>


      {/* ============================================= */}
      {/* STATISTICS */}
      {/* ============================================= */}

      <div className="stats-grid">


        <div className="stat-card">

          <div className="stat-icon">
            <FiDatabase />
          </div>

          <div>

            <p>Total Nodes</p>

            <h2>
              {stats.totalNodes ?? 0}
            </h2>

            <span>
              Neo4j entities
            </span>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <FiShare2 />
          </div>

          <div>

            <p>Relationships</p>

            <h2>
              {stats.totalRelationships ?? 0}
            </h2>

            <span>
              Graph connections
            </span>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <FiActivity />
          </div>

          <div>

            <p>Graph Updates</p>

            <h2>
              {stats.graphUpdates ?? 0}
            </h2>

            <span>
              Evolution records
            </span>

          </div>

        </div>


        <div className="stat-card verified-card">

          <div className="stat-icon">
            <FiShield />
          </div>

          <div>

            <p>Verified Updates</p>

            <h2>
              {stats.blockchainVerified ?? 0}
            </h2>

            <span>
              Blockchain verified
            </span>

          </div>

        </div>

      </div>


      {/* ============================================= */}
      {/* MAIN DASHBOARD GRID */}
      {/* ============================================= */}

      <div className="dashboard-grid">


        {/* =========================================== */}
        {/* SYSTEM ARCHITECTURE */}
        {/* =========================================== */}

        <section className="dashboard-panel">

          <div className="panel-header">

            <div>

              <h2>
                System Architecture
              </h2>

              <p>
                Live decentralized graph pipeline
              </p>

            </div>

          </div>


          <div className="architecture-flow">


            <div className="architecture-node">

              <FiDatabase />

              <strong>
                Neo4j
              </strong>

              <span>
                Knowledge Graph
              </span>

            </div>


            <div className="flow-arrow">
              →
            </div>


            <div className="architecture-node">

              <FiActivity />

              <strong>
                SHA-256
              </strong>

              <span>
                Graph Hash
              </span>

            </div>


            <div className="flow-arrow">
              →
            </div>


            <div className="architecture-node">

              <FiBox />

              <strong>
                Smart Contract
              </strong>

              <span>
                Knowledge Ledger
              </span>

            </div>


            <div className="flow-arrow">
              →
            </div>


            <div className="architecture-node">

              <FiShield />

              <strong>
                Sepolia
              </strong>

              <span>
                Blockchain Proof
              </span>

            </div>


          </div>

        </section>


        {/* =========================================== */}
        {/* BLOCKCHAIN STATUS */}
        {/* =========================================== */}

        <section className="dashboard-panel blockchain-panel">

          <div className="panel-header">

            <div>

              <h2>
                Blockchain Status
              </h2>

              <p>
                Smart contract connection
              </p>

            </div>


            <span className="status-badge success">

              <span className="status-dot"></span>

              Connected

            </span>

          </div>


          <div className="blockchain-info">


            <div className="info-row">

              <span>
                Network
              </span>

              <strong>
                {blockchain?.network ||
                  "Ethereum Sepolia"}
              </strong>

            </div>


            <div className="info-row">

              <span>
                Contract
              </span>

              <strong
                className="hash-text"
                title={blockchain?.contract}
              >

                {shortenHash(
                  blockchain?.contract
                )}

              </strong>

            </div>


            <div className="info-row">

              <span>
                Blockchain Records
              </span>

              <strong>
                {
                  blockchain
                    ?.totalBlockchainUpdates ??
                  stats.blockchainRecords ??
                  0
                }
              </strong>

            </div>


            <div className="blockchain-health">

              <FiCheckCircle />

              <div>

                <strong>
                  Blockchain operational
                </strong>

                <p>
                  Smart contract is responding
                  successfully.
                </p>

              </div>

            </div>


          </div>

        </section>

      </div>


      {/* ============================================= */}
      {/* RECENT EVOLUTION */}
      {/* ============================================= */}

      <section className="dashboard-panel history-panel">


        <div className="panel-header">

          <div>

            <h2>
              Recent Graph Evolution
            </h2>

            <p>
              Latest knowledge graph changes
            </p>

          </div>


          <div className="panel-icon">
            <FiClock />
          </div>

        </div>


        {history.length === 0 ? (

          <div className="empty-state">

            <FiActivity />

            <h3>
              No graph updates yet
            </h3>

            <p>
              Evolution records will appear
              here when knowledge is added.
            </p>

          </div>

        ) : (

          <div className="history-list">

            {history.map((item) => (

              <div
                className="history-item"
                key={item.updateId}
              >

                <div className="history-icon">

                  {item.blockchain?.verified ? (
                    <FiCheckCircle />
                  ) : (
                    <FiClock />
                  )}

                </div>


                <div className="history-content">

                  <div className="history-top">

                    <div>

                      <strong>
                        {item.description ||
                          "Graph Update"}
                      </strong>

                      <p>
                        {item.updateId}
                      </p>

                    </div>


                    <span
                      className={
                        item.blockchain?.verified
                          ? "status-badge success"
                          : "status-badge pending"
                      }
                    >

                      {
                        item.blockchain?.verified
                          ? "Blockchain Verified"
                          : item.blockchain
                              ?.status ||
                            "Pending"
                      }

                    </span>

                  </div>


                  <div className="history-details">


                    <span>

                      <strong>
                        Source:
                      </strong>{" "}

                      {
                        item.source
                          ?.studentId ||
                        "Unknown"
                      }

                    </span>


                    <span>

                      <strong>
                        Relationship:
                      </strong>{" "}

                      {
                        item.relationship ||
                        "Unknown"
                      }

                    </span>


                    <span>

                      <strong>
                        Target:
                      </strong>{" "}

                      {
                        item.target
                          ?.certificateId ||
                        "Unknown"
                      }

                    </span>


                    {item.blockchain
                      ?.blockNumber && (

                      <span>

                        <strong>
                          Block:
                        </strong>{" "}

                        {
                          item.blockchain
                            .blockNumber
                        }

                      </span>

                    )}


                  </div>


                  {item.blockchain
                    ?.transactionHash && (

                    <div className="transaction-preview">

                      TX:

                      <code>
                        {
                          item.blockchain
                            .transactionHash
                        }
                      </code>

                    </div>

                  )}


                </div>

              </div>

            ))}

          </div>

        )}


      </section>


    </div>

  );

}


export default Dashboard;