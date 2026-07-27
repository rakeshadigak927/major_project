import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";

import {
  FiShare2,
  FiRefreshCw,
  FiAlertCircle,
  FiMaximize2,
  FiDatabase,
  FiShield,
  FiCheckCircle,
  FiExternalLink,
  FiLink,
  FiUser,
} from "react-icons/fi";

import {
  getStudents,
  getStudent,
  getEvolutionHistory,
  getApiErrorMessage,
} from "../services/api";


// =====================================================
// KNOWLEDGE GRAPH
// =====================================================

function KnowledgeGraph() {

  const graphContainer = useRef(null);
  const cyInstance = useRef(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [nodeCount, setNodeCount] =
    useState(0);

  const [edgeCount, setEdgeCount] =
    useState(0);

  const [selectedItem, setSelectedItem] =
    useState(null);


  // =====================================================
  // NODE COLORS
  // =====================================================

  const getNodeColor = (type) => {

    switch (type) {

      case "Student":
        return "#6366f1";

      case "Certificate":
        return "#10b981";

      case "Course":
        return "#f59e0b";

      case "Project":
        return "#ec4899";

      case "Skill":
        return "#8b5cf6";

      case "Department":
        return "#06b6d4";

      default:
        return "#64748b";

    }

  };


  // =====================================================
  // FORMAT NEO4J VALUES
  // =====================================================

  const formatValue = (value) => {

    if (
      value === null ||
      value === undefined
    ) {

      return "—";

    }


    // Neo4j Integer
    if (
      typeof value === "object" &&
      value.low !== undefined
    ) {

      return String(
        value.low
      );

    }


    // Neo4j DateTime
    if (
      typeof value === "object" &&
      value.year?.low !== undefined
    ) {

      const year =
        value.year?.low;

      const month =
        String(
          value.month?.low || 1
        ).padStart(2, "0");

      const day =
        String(
          value.day?.low || 1
        ).padStart(2, "0");

      const hour =
        String(
          value.hour?.low || 0
        ).padStart(2, "0");

      const minute =
        String(
          value.minute?.low || 0
        ).padStart(2, "0");

      const second =
        String(
          value.second?.low || 0
        ).padStart(2, "0");


      return (
        `${year}-${month}-${day} ` +
        `${hour}:${minute}:${second}`
      );

    }


    if (
      typeof value === "object"
    ) {

      return JSON.stringify(
        value
      );

    }


    return String(value);

  };


  // =====================================================
  // SHORT VALUE
  // =====================================================

  const shortenValue = (
    value,
    start = 10,
    end = 8
  ) => {

    if (!value) {

      return "—";

    }


    const stringValue =
      String(value);


    if (
      stringValue.length <=
      start + end + 3
    ) {

      return stringValue;

    }


    return (
      stringValue.slice(0, start) +
      "..." +
      stringValue.slice(-end)
    );

  };


  // =====================================================
  // BUILD EVOLUTION HISTORY MAP
  // =====================================================

  const getEvolutionMap = async () => {

    try {

      const response =
        await getEvolutionHistory();


      if (!response?.success) {

        return new Map();

      }


      const history =
        response.data || [];


      const map =
        new Map();


      history.forEach(
        (record) => {

          if (
            record?.updateId
          ) {

            map.set(
              record.updateId,
              record
            );

          }

        }
      );


      return map;


    } catch (historyError) {

      console.error(
        "Unable to load evolution history:",
        historyError
      );


      // Graph should still load even if
      // blockchain history cannot be loaded.
      return new Map();

    }

  };


  // =====================================================
  // BUILD GRAPH
  // =====================================================

  const buildGraphElements = async () => {

    // ---------------------------------------------------
    // LOAD STUDENTS AND EVOLUTION HISTORY
    // ---------------------------------------------------

    const [
      studentsResponse,
      evolutionMap,
    ] = await Promise.all([

      getStudents(),

      getEvolutionMap(),

    ]);


    if (
      !studentsResponse.success
    ) {

      throw new Error(
        "Unable to retrieve students"
      );

    }


    const students =
      studentsResponse.data || [];


    const elements = [];

    const existingNodes =
      new Set();

    const existingEdges =
      new Set();


    // ===================================================
    // EACH STUDENT
    // ===================================================

    for (
      const student of students
    ) {

      const studentId =
        student.studentId;


      if (!studentId) {

        continue;

      }


      // =================================================
      // STUDENT NODE
      // =================================================

      if (
        !existingNodes.has(
          studentId
        )
      ) {

        elements.push({

          data: {

            id:
              studentId,

            label:
              student.name ||
              studentId,

            subtitle:
              studentId,

            type:
              "Student",

            properties:
              student,

          },

        });


        existingNodes.add(
          studentId
        );

      }


      // =================================================
      // LOAD STUDENT KNOWLEDGE
      // =================================================

      try {

        const studentResponse =
          await getStudent(
            studentId
          );


        if (
          !studentResponse.success
        ) {

          continue;

        }


        const knowledge =
          studentResponse
            .data
            ?.knowledge || [];


        // ===============================================
        // EACH KNOWLEDGE RELATIONSHIP
        // ===============================================

        knowledge.forEach(
          (item, index) => {

            if (!item?.target) {

              return;

            }


            const target =
              item.target;


            const labels =
              item.targetLabels || [];


            const targetType =
              labels.length > 0
                ? labels[0]
                : "Entity";


            const targetId =

              target.certificateId ||

              target.courseId ||

              target.projectId ||

              target.skillId ||

              target.departmentId ||

              target.actorId ||

              target.id ||

              `${targetType}-${studentId}-${index}`;


            const targetLabel =

              target.name ||

              target.title ||

              target.certificateName ||

              targetId;


            // ===========================================
            // TARGET NODE
            // ===========================================

            if (
              !existingNodes.has(
                targetId
              )
            ) {

              elements.push({

                data: {

                  id:
                    targetId,

                  label:
                    targetLabel,

                  subtitle:
                    targetId,

                  type:
                    targetType,

                  properties:
                    target,

                },

              });


              existingNodes.add(
                targetId
              );

            }


            // ===========================================
            // RELATIONSHIP
            // ===========================================

            const relationship =
              item.relationship ||
              "RELATED_TO";


            const relationshipProperties =
              item.relationshipProperties ||
              {};


            const updateId =
              relationshipProperties
                .updateId ||
              null;


            // ===========================================
            // MATCH EVOLUTION HISTORY
            // ===========================================

            const evolutionRecord =
              updateId
                ? evolutionMap.get(
                    updateId
                  ) || null
                : null;


            // ===========================================
            // UNIQUE EDGE ID
            // ===========================================

            const edgeId =
              updateId
                ? `${studentId}-${relationship}-${targetId}-${updateId}`
                : `${studentId}-${relationship}-${targetId}`;


            if (
              !existingEdges.has(
                edgeId
              )
            ) {

              elements.push({

                data: {

                  id:
                    edgeId,

                  source:
                    studentId,

                  target:
                    targetId,

                  label:
                    relationship,

                  sourceLabel:
                    student.name ||
                    studentId,

                  targetLabel,

                  targetType,

                  targetProperties:
                    target,

                  relationshipProperties,

                  updateId,

                  evolution:
                    evolutionRecord,

                },

              });


              existingEdges.add(
                edgeId
              );

            }

          }
        );


      } catch (studentError) {

        console.error(
          `Unable to load ${studentId}:`,
          studentError
        );

      }

    }


    return elements;

  };


  // =====================================================
  // INITIALIZE CYTOSCAPE
  // =====================================================

  const initializeGraph = (
    elements
  ) => {

    if (
      !graphContainer.current
    ) {

      return;

    }


    // Destroy old graph
    if (
      cyInstance.current
    ) {

      cyInstance.current.destroy();

    }


    const cy =
      cytoscape({

        container:
          graphContainer.current,

        elements,


        // ===============================================
        // STYLE
        // ===============================================

        style: [

          // =============================================
          // NODE
          // =============================================

          {

            selector:
              "node",

            style: {

              "background-color":
                (element) =>
                  getNodeColor(
                    element.data(
                      "type"
                    )
                  ),

              label:
                "data(label)",

              color:
                "#e2e8f0",

              "font-size":
                "11px",

              "font-weight":
                "600",

              "text-valign":
                "bottom",

              "text-halign":
                "center",

              "text-margin-y":
                "8px",

              "text-wrap":
                "wrap",

              "text-max-width":
                "120px",

              width:
                "52px",

              height:
                "52px",

              "border-width":
                "3px",

              "border-color":
                "#ffffff",

              "border-opacity":
                0.15,

              "overlay-opacity":
                0,

            },

          },


          // =============================================
          // SELECTED NODE
          // =============================================

          {

            selector:
              "node:selected",

            style: {

              "border-width":
                "4px",

              "border-color":
                "#ffffff",

              width:
                "62px",

              height:
                "62px",

            },

          },


          // =============================================
          // EDGE
          // =============================================

          {

            selector:
              "edge",

            style: {

              width:
                2,

              "line-color":
                "#475569",

              "target-arrow-color":
                "#64748b",

              "target-arrow-shape":
                "triangle",

              "curve-style":
                "bezier",

              label:
                "data(label)",

              color:
                "#94a3b8",

              "font-size":
                "8px",

              "font-weight":
                "600",

              "text-background-color":
                "#0f172a",

              "text-background-opacity":
                1,

              "text-background-padding":
                "4px",

              "text-rotation":
                "autorotate",

              "arrow-scale":
                0.8,

              "overlay-opacity":
                0,

            },

          },


          // =============================================
          // BLOCKCHAIN LINKED EDGE
          // =============================================

          {

            selector:
              "edge[updateId]",

            style: {

              width:
                3,

              "line-style":
                "solid",

            },

          },


          // =============================================
          // SELECTED EDGE
          // =============================================

          {

            selector:
              "edge:selected",

            style: {

              width:
                5,

              "line-color":
                "#818cf8",

              "target-arrow-color":
                "#818cf8",

              color:
                "#c7d2fe",

            },

          },

        ],


        // ===============================================
        // LAYOUT
        // ===============================================

        layout: {

          name:
            "cose",

          animate:
            true,

          animationDuration:
            800,

          fit:
            true,

          padding:
            60,

          nodeRepulsion:
            9000,

          idealEdgeLength:
            140,

          edgeElasticity:
            100,

          gravity:
            0.25,

        },


        minZoom:
          0.3,

        maxZoom:
          2.5,

        wheelSensitivity:
          0.2,

      });


    // =================================================
    // NODE CLICK
    // =================================================

    cy.on(
      "tap",
      "node",
      (event) => {

        const node =
          event.target;


        setSelectedItem({

          kind:
            "node",

          id:
            node.id(),

          label:
            node.data(
              "label"
            ),

          type:
            node.data(
              "type"
            ),

          properties:
            node.data(
              "properties"
            ),

        });

      }
    );


    // =================================================
    // EDGE CLICK
    // =================================================

    cy.on(
      "tap",
      "edge",
      (event) => {

        const edge =
          event.target;


        setSelectedItem({

          kind:
            "relationship",

          id:
            edge.id(),

          relationship:
            edge.data(
              "label"
            ),

          source:
            edge.data(
              "source"
            ),

          sourceLabel:
            edge.data(
              "sourceLabel"
            ),

          target:
            edge.data(
              "target"
            ),

          targetLabel:
            edge.data(
              "targetLabel"
            ),

          targetType:
            edge.data(
              "targetType"
            ),

          targetProperties:
            edge.data(
              "targetProperties"
            ),

          properties:
            edge.data(
              "relationshipProperties"
            ),

          updateId:
            edge.data(
              "updateId"
            ),

          evolution:
            edge.data(
              "evolution"
            ),

        });

      }
    );


    // =================================================
    // BACKGROUND CLICK
    // =================================================

    cy.on(
      "tap",
      (event) => {

        if (
          event.target === cy
        ) {

          setSelectedItem(
            null
          );

        }

      }
    );


    cyInstance.current =
      cy;


    setNodeCount(
      cy.nodes().length
    );


    setEdgeCount(
      cy.edges().length
    );

  };


  // =====================================================
  // LOAD GRAPH
  // =====================================================

  const loadGraph = async () => {

    try {

      setLoading(true);

      setError("");

      setSelectedItem(
        null
      );


      const elements =
        await buildGraphElements();


      initializeGraph(
        elements
      );


    } catch (err) {

      console.error(
        "Graph loading error:",
        err
      );


      setError(
        getApiErrorMessage(
          err
        )
      );


    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadGraph();


    return () => {

      if (
        cyInstance.current
      ) {

        cyInstance.current.destroy();

        cyInstance.current =
          null;

      }

    };

  }, []);


  // =====================================================
  // FIT GRAPH
  // =====================================================

  const fitGraph = () => {

    if (
      cyInstance.current
    ) {

      cyInstance.current.fit(
        undefined,
        60
      );

    }

  };


  // =====================================================
  // OPEN ETHERSCAN TRANSACTION
  // =====================================================

  const openTransaction = (
    transactionHash
  ) => {

    if (!transactionHash) {

      return;

    }


    window.open(

      `https://sepolia.etherscan.io/tx/${transactionHash}`,

      "_blank",

      "noopener,noreferrer"

    );

  };


  // =====================================================
  // SELECTED RELATIONSHIP VALUES
  // =====================================================

  const evolution =
    selectedItem?.kind ===
      "relationship"
      ? selectedItem.evolution
      : null;


  const blockchain =
    evolution?.blockchain ||
    null;


  const provenance =
    evolution?.provenance ||
    null;


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="graph-page">


      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            GRAPH EXPLORER
          </p>


          <h1>
            Knowledge Graph
          </h1>


          <p className="page-description">

            Explore students,
            certificates and evolving
            relationships with blockchain
            provenance.

          </p>

        </div>


        <div className="header-actions">


          <button
            type="button"
            className="secondary-button"
            onClick={
              fitGraph
            }
          >

            <FiMaximize2 />

            Fit Graph

          </button>


          <button
            type="button"
            className="primary-button"
            onClick={
              loadGraph
            }
          >

            <FiRefreshCw />

            Refresh

          </button>


        </div>

      </div>


      {/* ============================================= */}
      {/* GRAPH SUMMARY */}
      {/* ============================================= */}

      <div className="graph-summary">


        <div>

          <FiDatabase />

          <span>
            Nodes
          </span>

          <strong>
            {nodeCount}
          </strong>

        </div>


        <div>

          <FiShare2 />

          <span>
            Relationships
          </span>

          <strong>
            {edgeCount}
          </strong>

        </div>


        <div className="graph-legend">

          <span>

            <i
              style={{
                background:
                  "#6366f1",
              }}
            />

            Student

          </span>


          <span>

            <i
              style={{
                background:
                  "#10b981",
              }}
            />

            Certificate

          </span>


          <span>

            <i
              style={{
                background:
                  "#f59e0b",
              }}
            />

            Course

          </span>


          <span>

            <i
              style={{
                background:
                  "#ec4899",
              }}
            />

            Project

          </span>


          <span>

            <i
              style={{
                background:
                  "#8b5cf6",
              }}
            />

            Skill

          </span>

        </div>

      </div>


      {/* ============================================= */}
      {/* GRAPH WORKSPACE */}
      {/* ============================================= */}

      <div className="graph-workspace">


        {/* =========================================== */}
        {/* CYTOSCAPE */}
        {/* =========================================== */}

        <div className="graph-container-wrapper">


          {loading && (

            <div className="graph-overlay">

              <FiRefreshCw
                className="spin-icon"
              />

              <h3>
                Loading Knowledge Graph
              </h3>

              <p>
                Reading graph evolution
                from Neo4j and blockchain
                history.
              </p>

            </div>

          )}


          {error && (

            <div className="graph-overlay error-state">

              <FiAlertCircle />

              <h3>
                Unable to load graph
              </h3>

              <p>
                {error}
              </p>


              <button
                type="button"
                className="primary-button"
                onClick={
                  loadGraph
                }
              >

                Try Again

              </button>

            </div>

          )}


          <div
            ref={
              graphContainer
            }
            className="cytoscape-container"
          />


        </div>


        {/* =========================================== */}
        {/* DETAILS PANEL */}
        {/* =========================================== */}

        <aside className="node-details-panel">


          <div className="panel-header">

            <div>

              <h2>

                {
                  selectedItem?.kind ===
                    "relationship"
                    ? "Relationship Details"
                    : "Node Details"
                }

              </h2>


              <p>

                {
                  selectedItem?.kind ===
                    "relationship"
                    ? "Blockchain evolution and provenance"
                    : "Select a graph node or relationship"
                }

              </p>

            </div>

          </div>


          {/* ========================================= */}
          {/* NOTHING SELECTED */}
          {/* ========================================= */}

          {!selectedItem ? (

            <div className="node-empty-state">

              <FiShare2 />

              <h3>
                Nothing selected
              </h3>

              <p>
                Click a node to inspect
                its properties, or click
                an arrow to inspect its
                evolution and blockchain
                proof.
              </p>

            </div>


          ) : selectedItem.kind ===
              "node" ? (


            /* ======================================= */
            /* NODE DETAILS */
            /* ======================================= */

            <div className="selected-node">


              <div
                className="selected-node-icon"
                style={{
                  background:
                    getNodeColor(
                      selectedItem.type
                    ),
                }}
              >

                <FiDatabase />

              </div>


              <h2>
                {selectedItem.label}
              </h2>


              <span className="node-type-badge">

                {selectedItem.type}

              </span>


              <div className="node-id">

                {selectedItem.id}

              </div>


              <div className="property-list">


                {Object.entries(
                  selectedItem.properties ||
                    {}
                ).map(
                  ([key, value]) => (

                    <div
                      className="property-row"
                      key={key}
                    >

                      <span>
                        {key}
                      </span>

                      <strong>
                        {
                          formatValue(
                            value
                          )
                        }
                      </strong>

                    </div>

                  )
                )}


              </div>

            </div>


          ) : (


            /* ======================================= */
            /* RELATIONSHIP DETAILS */
            /* ======================================= */

            <div className="selected-node">


              {/* RELATIONSHIP ICON */}

              <div
                className="selected-node-icon"
                style={{
                  background:
                    "#6366f1",
                }}
              >

                <FiLink />

              </div>


              <h2>
                {
                  selectedItem.relationship
                }
              </h2>


              <span className="node-type-badge">

                Relationship

              </span>


              {/* ===================================== */}
              {/* SOURCE → TARGET */}
              {/* ===================================== */}

              <div className="property-list">


                <div className="property-row">

                  <span>
                    Source
                  </span>

                  <strong>
                    {
                      selectedItem
                        .sourceLabel ||
                      selectedItem
                        .source
                    }
                  </strong>

                </div>


                <div className="property-row">

                  <span>
                    Relationship
                  </span>

                  <strong>
                    {
                      selectedItem
                        .relationship
                    }
                  </strong>

                </div>


                <div className="property-row">

                  <span>
                    Target
                  </span>

                  <strong>
                    {
                      selectedItem
                        .targetLabel ||
                      selectedItem
                        .target
                    }
                  </strong>

                </div>


                <div className="property-row">

                  <span>
                    Target ID
                  </span>

                  <strong>
                    {
                      selectedItem
                        .target
                    }
                  </strong>

                </div>


                {
                  selectedItem
                    .targetProperties
                    ?.issuer && (

                    <div className="property-row">

                      <span>
                        Issuer
                      </span>

                      <strong>

                        {
                          selectedItem
                            .targetProperties
                            .issuer
                        }

                      </strong>

                    </div>

                  )
                }


                {
                  selectedItem
                    .properties
                    ?.year && (

                    <div className="property-row">

                      <span>
                        Year
                      </span>

                      <strong>

                        {
                          formatValue(
                            selectedItem
                              .properties
                              .year
                          )
                        }

                      </strong>

                    </div>

                  )
                }


                {
                  selectedItem
                    .properties
                    ?.createdAt && (

                    <div className="property-row">

                      <span>
                        Created
                      </span>

                      <strong>

                        {
                          formatValue(
                            selectedItem
                              .properties
                              .createdAt
                          )
                        }

                      </strong>

                    </div>

                  )
                }


              </div>


              {/* ===================================== */}
              {/* UPDATE ID */}
              {/* ===================================== */}

              {
                selectedItem.updateId ? (

                  <div className="proof-section">

                    <h3>
                      Evolution Record
                    </h3>


                    <div className="proof-data-row vertical">

                      <span>
                        Update ID
                      </span>

                      <code>

                        {
                          selectedItem
                            .updateId
                        }

                      </code>

                    </div>

                  </div>

                ) : (

                  <div className="verification-result invalid">

                    <FiAlertCircle />


                    <div>

                      <strong>
                        Legacy Relationship
                      </strong>

                      <p>
                        This relationship does
                        not contain an evolution
                        update ID.
                      </p>

                    </div>

                  </div>

                )
              }


              {/* ===================================== */}
              {/* PROVENANCE */}
              {/* ===================================== */}

              {
                provenance && (

                  <div className="proof-section">

                    <h3>
                      Provenance
                    </h3>


                    {
                      provenance.name && (

                        <div className="proof-data-row">

                          <span>
                            Submitted By
                          </span>

                          <strong>
                            {
                              provenance.name
                            }
                          </strong>

                        </div>

                      )
                    }


                    {
                      provenance.actorId && (

                        <div className="proof-data-row">

                          <span>
                            Actor ID
                          </span>

                          <strong>
                            {
                              provenance.actorId
                            }
                          </strong>

                        </div>

                      )
                    }


                    {
                      provenance.role && (

                        <div className="proof-data-row">

                          <span>
                            Role
                          </span>

                          <strong>
                            {
                              provenance.role
                            }
                          </strong>

                        </div>

                      )
                    }

                  </div>

                )
              }


              {/* ===================================== */}
              {/* BLOCKCHAIN PROOF */}
              {/* ===================================== */}

              {
                selectedItem.updateId &&
                blockchain ? (

                  <div className="proof-section">

                    <h3>
                      Blockchain Proof
                    </h3>


                    {/* STATUS */}

                    <div className="proof-data-row">

                      <span>
                        Status
                      </span>

                      <strong>

                        {
                          blockchain
                            .verified
                            ? "VERIFIED"
                            : (
                              blockchain
                                .status ||
                              "NOT VERIFIED"
                            )
                        }

                      </strong>

                    </div>


                    {/* UPDATE ID */}

                    {
                      blockchain
                        .blockchainUpdateId && (

                        <div className="proof-data-row">

                          <span>
                            Blockchain ID
                          </span>

                          <strong>

                            {
                              blockchain
                                .blockchainUpdateId
                            }

                          </strong>

                        </div>

                      )
                    }


                    {/* DATA HASH */}

                    {
                      blockchain
                        .dataHash && (

                        <div className="proof-data-row vertical">

                          <span>
                            Data Hash
                          </span>

                          <code
                            title={
                              blockchain
                                .dataHash
                            }
                          >

                            {
                              shortenValue(
                                blockchain
                                  .dataHash
                              )
                            }

                          </code>

                        </div>

                      )
                    }


                    {/* TRANSACTION */}

                    {
                      blockchain
                        .transactionHash && (

                        <div className="proof-data-row vertical">

                          <span>
                            Transaction
                          </span>

                          <code
                            title={
                              blockchain
                                .transactionHash
                            }
                          >

                            {
                              shortenValue(
                                blockchain
                                  .transactionHash
                              )
                            }

                          </code>

                        </div>

                      )
                    }


                    {/* BLOCK */}

                    {
                      blockchain
                        .blockNumber !==
                        null &&
                      blockchain
                        .blockNumber !==
                        undefined && (

                        <div className="proof-data-row">

                          <span>
                            Block
                          </span>

                          <strong>

                            {
                              blockchain
                                .blockNumber
                            }

                          </strong>

                        </div>

                      )
                    }


                    {/* NETWORK */}

                    <div className="proof-data-row">

                      <span>
                        Network
                      </span>

                      <strong>
                        Ethereum Sepolia
                      </strong>

                    </div>


                    {/* VERIFIED BANNER */}

                    {
                      blockchain
                        .verified && (

                        <div className="verification-result valid">

                          <FiCheckCircle />


                          <div>

                            <strong>
                              Blockchain Verified
                            </strong>

                            <p>
                              This graph evolution
                              has an associated
                              blockchain proof.
                            </p>

                          </div>

                        </div>

                      )
                    }


                    {/* ETHERSCAN */}

                    {
                      blockchain
                        .transactionHash && (

                        <button
                          type="button"
                          className="verify-button"
                          onClick={
                            () =>
                              openTransaction(
                                blockchain
                                  .transactionHash
                              )
                          }
                        >

                          <FiExternalLink />

                          View on Etherscan

                        </button>

                      )
                    }


                  </div>

                ) : selectedItem.updateId ? (

                  <div className="verification-result invalid">

                    <FiAlertCircle />


                    <div>

                      <strong>
                        No Blockchain Proof Found
                      </strong>

                      <p>
                        An evolution update ID
                        exists, but no matching
                        evolution-history record
                        was returned.
                      </p>

                    </div>

                  </div>

                ) : null
              }


              {/* ===================================== */}
              {/* EVOLUTION DESCRIPTION */}
              {/* ===================================== */}

              {
                evolution?.description && (

                  <div className="proof-section">

                    <h3>
                      Evolution Description
                    </h3>

                    <p>
                      {
                        evolution.description
                      }
                    </p>

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


export default KnowledgeGraph;