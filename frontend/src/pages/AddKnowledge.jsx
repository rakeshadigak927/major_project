import { useEffect, useState } from "react";

import {
  FiPlusCircle,
  FiUser,
  FiAward,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiDatabase,
  FiHash,
  FiBox,
  FiRefreshCw,
} from "react-icons/fi";

import {
  prepareMetaMaskKnowledge,
  confirmMetaMaskKnowledge,
  getStudents,
  verifyUpdate,
  getApiErrorMessage,
} from "../services/api";

import {
  submitUpdateWithMetaMask,
  getMetaMaskErrorMessage,
} from "../services/metamask";


function AddKnowledge() {

  // =====================================================
  // STATE
  // =====================================================

  const [students, setStudents] = useState([]);

  const [loadingStudents, setLoadingStudents] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [verifying, setVerifying] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [
    verificationResult,
    setVerificationResult
  ] = useState(null);

  const [
    transactionStage,
    setTransactionStage
  ] = useState("");


  const [formData, setFormData] = useState({

    studentId: "",

    certificateId: "",

    certificateName: "",

    issuer: "",

    submittedBy: "FAC001",

  });


  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  const loadStudents = async () => {

    try {

      setLoadingStudents(true);

      setError("");


      const response =
        await getStudents();


      if (response.success) {

        const studentList =
          response.data || [];


        setStudents(
          studentList
        );


        if (
          studentList.length > 0
        ) {

          setFormData(
            previous => ({

              ...previous,

              studentId:
                previous.studentId ||
                studentList[0]
                  .studentId,

            })
          );

        }

      }

    } catch (err) {

      console.error(
        "Student loading error:",
        err
      );


      setError(
        getApiErrorMessage(err)
      );

    } finally {

      setLoadingStudents(false);

    }

  };


  useEffect(() => {

    loadStudents();

  }, []);


  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      previous => ({

        ...previous,

        [name]: value,

      })
    );

  };


  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {

    if (!formData.studentId) {

      return "Please select a student.";

    }


    if (
      !formData
        .certificateId
        .trim()
    ) {

      return "Certificate ID is required.";

    }


    if (
      !formData
        .certificateName
        .trim()
    ) {

      return "Certificate name is required.";

    }


    if (
      !formData
        .issuer
        .trim()
    ) {

      return "Issuer is required.";

    }


    if (
      !formData
        .submittedBy
        .trim()
    ) {

      return "Submitter ID is required.";

    }


    return null;

  };


  // =====================================================
  // ADD KNOWLEDGE WITH METAMASK
  // =====================================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    const validationError =
      validateForm();


    if (validationError) {

      setError(
        validationError
      );

      return;

    }


    try {

      setSubmitting(true);

      setError("");

      setResult(null);

      setVerificationResult(
        null
      );


      // =================================================
      // STEP 1 - PREPARE KNOWLEDGE ON BACKEND
      // =================================================

      setTransactionStage(
        "Preparing knowledge..."
      );


      const prepared =
        await prepareMetaMaskKnowledge({

          studentId:
            formData.studentId,

          certificateId:
            formData
              .certificateId
              .trim(),

          certificateName:
            formData
              .certificateName
              .trim(),

          issuer:
            formData
              .issuer
              .trim(),

          submittedBy:
            formData
              .submittedBy
              .trim(),

        });


      if (
        !prepared?.success ||
        !prepared?.data
      ) {

        throw new Error(
          prepared?.message ||
          "Knowledge preparation failed."
        );

      }


      const preparedData =
        prepared.data;


      // =================================================
      // STEP 2 - METAMASK CONFIRMATION
      // =================================================

      setTransactionStage(
        "Waiting for MetaMask confirmation..."
      );


      const blockchainResult =
        await submitUpdateWithMetaMask({

          updateId:
            preparedData.updateId,

          dataHash:
            preparedData.dataHash,

          metadata:
            preparedData.metadata,

        });


      if (
        !blockchainResult?.success
      ) {

        throw new Error(
          "Blockchain transaction failed."
        );

      }


      // =================================================
      // STEP 3 - TRANSACTION MINED
      // =================================================

      setTransactionStage(
        "Transaction confirmed. Verifying with backend..."
      );


      // =================================================
      // STEP 4 - BACKEND VERIFICATION
      // =================================================

      const confirmed =
        await confirmMetaMaskKnowledge({

          updateId:
            preparedData.updateId,

          dataHash:
            preparedData.dataHash,

          transactionHash:
            blockchainResult
              .transactionHash,

          blockchainUpdateId:
            blockchainResult
              .blockchainUpdateId,

          walletAddress:
            blockchainResult
              .walletAddress,

        });


      if (
        !confirmed?.success
      ) {

        throw new Error(
          confirmed?.message ||
          "Blockchain confirmation failed."
        );

      }


      // =================================================
      // STEP 5 - SUCCESS
      // =================================================

      setTransactionStage(
        "Blockchain verified successfully."
      );


      setResult({

        updateId:
          preparedData.updateId,

        knowledge:
          preparedData.knowledge,

        certificate:
          preparedData.certificate,

        provenance:
          preparedData.provenance,

        blockchain: {

          ...confirmed.data.blockchain,

          dataHash:
            preparedData.dataHash,

          transactionHash:
            blockchainResult
              .transactionHash,

          blockNumber:
            blockchainResult
              .blockNumber,

          blockchainUpdateId:
            blockchainResult
              .blockchainUpdateId,

          walletAddress:
            blockchainResult
              .walletAddress,

          signingMethod:
            "METAMASK",

          status:
            "BLOCKCHAIN_VERIFIED",

          verified:
            true,

        },

      });


    } catch (err) {

      console.error(
        "MetaMask knowledge error:",
        err
      );


      setTransactionStage("");


      if (
        err?.code === 4001 ||
        err?.code ===
          "ACTION_REJECTED" ||
        err?.shortMessage ||
        err?.reason
      ) {

        setError(
          getMetaMaskErrorMessage(
            err
          )
        );

      } else {

        setError(
          getApiErrorMessage(
            err
          )
        );

      }

    } finally {

      setSubmitting(false);

    }

  };


  // =====================================================
  // VERIFY INTEGRITY
  // =====================================================

  const handleVerify = async () => {

    if (!result?.updateId) {

      return;

    }


    try {

      setVerifying(true);

      setError("");


      const response =
        await verifyUpdate(
          result.updateId
        );


      setVerificationResult(
        response
      );


    } catch (err) {

      console.error(
        "Verification error:",
        err
      );


      setError(
        getApiErrorMessage(err)
      );


    } finally {

      setVerifying(false);

    }

  };


  // =====================================================
  // RESET FORM
  // =====================================================

  const handleReset = () => {

    setFormData({

      studentId:
        students.length > 0
          ? students[0].studentId
          : "",

      certificateId: "",

      certificateName: "",

      issuer: "",

      submittedBy:
        "FAC001",

    });


    setResult(null);

    setVerificationResult(
      null
    );

    setTransactionStage("");

    setError("");

  };


  // =====================================================
  // SHORT VALUE
  // =====================================================

  const shortenValue = (
    value
  ) => {

    if (!value) {

      return "—";

    }


    const stringValue =
      String(value);


    if (
      stringValue.length < 26
    ) {

      return stringValue;

    }


    return (
      stringValue.slice(0, 12) +
      "..." +
      stringValue.slice(-10)
    );

  };


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="add-knowledge-page">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            KNOWLEDGE EVOLUTION
          </p>


          <h1>
            Add Knowledge
          </h1>


          <p className="page-description">

            Add a new relationship to the
            knowledge graph and anchor its
            cryptographic proof on Ethereum
            Sepolia using MetaMask.

          </p>

        </div>


        <div className="header-security">

          <FiShield />


          <div>

            <strong>
              MetaMask Protected
            </strong>


            <span>
              Ethereum Sepolia
            </span>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* WORKFLOW */}
      {/* ================================================= */}

      <div className="workflow-strip">


        <div className="workflow-step">

          <span>
            1
          </span>

          <div>

            <strong>
              Submit
            </strong>

            <p>
              Enter knowledge
            </p>

          </div>

        </div>


        <div className="workflow-line" />


        <div className="workflow-step">

          <span>
            2
          </span>

          <div>

            <strong>
              Hash
            </strong>

            <p>
              Generate SHA-256
            </p>

          </div>

        </div>


        <div className="workflow-line" />


        <div className="workflow-step">

          <span>
            3
          </span>

          <div>

            <strong>
              MetaMask
            </strong>

            <p>
              Sign transaction
            </p>

          </div>

        </div>


        <div className="workflow-line" />


        <div className="workflow-step">

          <span>
            4
          </span>

          <div>

            <strong>
              Blockchain
            </strong>

            <p>
              Anchor proof
            </p>

          </div>

        </div>


        <div className="workflow-line" />


        <div className="workflow-step">

          <span>
            5
          </span>

          <div>

            <strong>
              Verify
            </strong>

            <p>
              Confirm integrity
            </p>

          </div>

        </div>


      </div>


      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <div className="add-knowledge-grid">


        {/* =============================================== */}
        {/* FORM PANEL */}
        {/* =============================================== */}

        <section className="form-panel">


          <div className="panel-header">

            <div>

              <h2>
                New Knowledge Record
              </h2>


              <p>
                Student → EARNED → Certificate
              </p>

            </div>


            <FiPlusCircle />

          </div>


          {/* ============================================= */}
          {/* ERROR */}
          {/* ============================================= */}

          {error && (

            <div className="alert-box error">

              <FiAlertCircle />


              <div>

                <strong>
                  Request Failed
                </strong>


                <p>
                  {error}
                </p>

              </div>

            </div>

          )}


          {/* ============================================= */}
          {/* TRANSACTION STATUS */}
          {/* ============================================= */}

          {submitting &&
            transactionStage && (

              <div className="alert-box">

                <FiLoader
                  className="spin-icon"
                />


                <div>

                  <strong>
                    MetaMask Transaction
                  </strong>


                  <p>
                    {transactionStage}
                  </p>

                </div>

              </div>

            )}


          {/* ============================================= */}
          {/* FORM */}
          {/* ============================================= */}

          <form
            onSubmit={
              handleSubmit
            }
            className="knowledge-form"
          >


            {/* STUDENT */}

            <div className="form-group">

              <label>

                <FiUser />

                Student

              </label>


              <select
                name="studentId"
                value={
                  formData.studentId
                }
                onChange={
                  handleChange
                }
                disabled={
                  loadingStudents ||
                  submitting
                }
              >

                {loadingStudents ? (

                  <option value="">
                    Loading students...
                  </option>

                ) : students.length ===
                  0 ? (

                  <option value="">
                    No students found
                  </option>

                ) : (

                  students.map(
                    student => (

                      <option
                        key={
                          student.studentId
                        }
                        value={
                          student.studentId
                        }
                      >

                        {
                          student.studentId
                        }

                        {" - "}

                        {
                          student.name
                        }

                      </option>

                    )
                  )

                )}

              </select>

            </div>


            {/* CERTIFICATE ID */}

            <div className="form-group">

              <label>

                <FiAward />

                Certificate ID

              </label>


              <input
                type="text"
                name="certificateId"
                value={
                  formData
                    .certificateId
                }
                onChange={
                  handleChange
                }
                placeholder="Example: CERT007"
                disabled={
                  submitting
                }
              />

            </div>


            {/* CERTIFICATE NAME */}

            <div className="form-group">

              <label>

                <FiAward />

                Certificate Name

              </label>


              <input
                type="text"
                name="certificateName"
                value={
                  formData
                    .certificateName
                }
                onChange={
                  handleChange
                }
                placeholder="Example: MetaMask Blockchain Integration"
                disabled={
                  submitting
                }
              />

            </div>


            {/* ISSUER */}

            <div className="form-group">

              <label>

                <FiDatabase />

                Issuing Organization

              </label>


              <input
                type="text"
                name="issuer"
                value={
                  formData.issuer
                }
                onChange={
                  handleChange
                }
                placeholder="Example: VTU"
                disabled={
                  submitting
                }
              />

            </div>


            {/* SUBMITTED BY */}

            <div className="form-group">

              <label>

                <FiShield />

                Authorized Provider

              </label>


              <input
                type="text"
                name="submittedBy"
                value={
                  formData
                    .submittedBy
                }
                onChange={
                  handleChange
                }
                placeholder="Example: FAC001"
                disabled={
                  submitting
                }
              />

            </div>


            {/* =========================================== */}
            {/* ACTIONS */}
            {/* =========================================== */}

            <div className="form-actions">


              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleReset
                }
                disabled={
                  submitting
                }
              >

                <FiRefreshCw />

                Reset

              </button>


              <button
                type="submit"
                className="primary-button"
                disabled={
                  submitting ||
                  loadingStudents
                }
              >

                {submitting ? (

                  <>

                    <FiLoader
                      className="spin-icon"
                    />

                    Processing...

                  </>

                ) : (

                  <>

                    <FiShield />

                    Add with MetaMask

                  </>

                )}

              </button>


            </div>


          </form>


        </section>


        {/* =============================================== */}
        {/* BLOCKCHAIN PROOF */}
        {/* =============================================== */}

        <section className="proof-panel">


          <div className="panel-header">

            <div>

              <h2>
                Blockchain Proof
              </h2>


              <p>
                Transaction and integrity
                information
              </p>

            </div>


            <FiShield />

          </div>


          {/* ============================================= */}
          {/* EMPTY STATE */}
          {/* ============================================= */}

          {!result ? (

            <div className="proof-placeholder">

              <FiDatabase />


              <h3>
                No Blockchain Proof Yet
              </h3>


              <p>

                Submit a knowledge record
                and approve the transaction
                through MetaMask.

              </p>


              <div className="proof-flow">


                <div>

                  <FiDatabase />

                  <span>
                    Neo4j
                  </span>

                </div>


                <div>
                  ↓
                </div>


                <div>

                  <FiHash />

                  <span>
                    SHA-256
                  </span>

                </div>


                <div>
                  ↓
                </div>


                <div>

                  <FiShield />

                  <span>
                    MetaMask
                  </span>

                </div>


                <div>
                  ↓
                </div>


                <div>

                  <FiBox />

                  <span>
                    Sepolia
                  </span>

                </div>


              </div>

            </div>

          ) : (

            /* =========================================== */
            /* RESULT */
            /* =========================================== */

            <div className="proof-result">


              {/* SUCCESS */}

              <div className="success-banner">

                <FiCheckCircle />


                <div>

                  <h3>
                    Blockchain Verified
                  </h3>


                  <p>

                    Knowledge was successfully
                    added and anchored on
                    Ethereum Sepolia.

                  </p>

                </div>

              </div>


              {/* ========================================= */}
              {/* KNOWLEDGE EVOLUTION */}
              {/* ========================================= */}

              <div className="proof-section">

                <h3>
                  Knowledge Evolution
                </h3>


                <div className="knowledge-path">


                  <div>

                    <small>
                      STUDENT
                    </small>


                    <strong>

                      {
                        result
                          .knowledge
                          ?.source
                      }

                    </strong>

                  </div>


                  <span>
                    EARNED →
                  </span>


                  <div>

                    <small>
                      CERTIFICATE
                    </small>


                    <strong>

                      {
                        result
                          .knowledge
                          ?.target
                      }

                    </strong>

                  </div>


                </div>

              </div>


              {/* ========================================= */}
              {/* CRYPTOGRAPHIC PROOF */}
              {/* ========================================= */}

              <div className="proof-section">

                <h3>
                  Cryptographic Proof
                </h3>


                <div className="proof-data-row">

                  <span>
                    Update ID
                  </span>


                  <code>
                    {result.updateId}
                  </code>

                </div>


                <div className="proof-data-row">

                  <span>
                    Status
                  </span>


                  <strong className="success-text">

                    {
                      result
                        .blockchain
                        ?.status
                    }

                  </strong>

                </div>


                <div className="proof-data-row">

                  <span>
                    Signing Method
                  </span>


                  <strong>
                    MetaMask
                  </strong>

                </div>


                <div className="proof-data-row vertical">

                  <span>
                    Wallet Address
                  </span>


                  <code
                    title={
                      result
                        .blockchain
                        ?.walletAddress
                    }
                  >

                    {
                      shortenValue(
                        result
                          .blockchain
                          ?.walletAddress
                      )
                    }

                  </code>

                </div>


                <div className="proof-data-row">

                  <span>
                    Blockchain Update
                  </span>


                  <strong>

                    #
                    {
                      result
                        .blockchain
                        ?.blockchainUpdateId
                    }

                  </strong>

                </div>


                <div className="proof-data-row">

                  <span>
                    Block Number
                  </span>


                  <strong>

                    {
                      result
                        .blockchain
                        ?.blockNumber
                    }

                  </strong>

                </div>


                <div className="proof-data-row vertical">

                  <span>
                    SHA-256 Data Hash
                  </span>


                  <code
                    title={
                      result
                        .blockchain
                        ?.dataHash
                    }
                  >

                    {
                      shortenValue(
                        result
                          .blockchain
                          ?.dataHash
                      )
                    }

                  </code>

                </div>


                <div className="proof-data-row vertical">

                  <span>
                    Transaction Hash
                  </span>


                  <code
                    title={
                      result
                        .blockchain
                        ?.transactionHash
                    }
                  >

                    {
                      shortenValue(
                        result
                          .blockchain
                          ?.transactionHash
                      )
                    }

                  </code>

                </div>


              </div>


              {/* ========================================= */}
              {/* VERIFY BUTTON */}
              {/* ========================================= */}

              <button
                type="button"
                className="verify-button"
                onClick={
                  handleVerify
                }
                disabled={
                  verifying
                }
              >

                {verifying ? (

                  <>

                    <FiLoader
                      className="spin-icon"
                    />

                    Verifying...

                  </>

                ) : (

                  <>

                    <FiShield />

                    Verify Integrity
                    Against Blockchain

                  </>

                )}

              </button>


              {/* ========================================= */}
              {/* VERIFICATION RESULT */}
              {/* ========================================= */}

              {verificationResult && (

                <div
                  className={
                    verificationResult
                      .verified
                      ? "verification-result valid"
                      : "verification-result invalid"
                  }
                >

                  {
                    verificationResult
                      .verified
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
                        verificationResult
                          .verified
                          ? "Integrity Valid"
                          : "Integrity Invalid"
                      }

                    </strong>


                    <p>

                      Blockchain verification:

                      {" "}

                      {
                        verificationResult
                          .integrity ||
                        (
                          verificationResult
                            .verified
                            ? "VALID"
                            : "INVALID"
                        )
                      }

                    </p>

                  </div>

                </div>

              )}


            </div>

          )}


        </section>


      </div>


    </div>

  );

}


export default AddKnowledge;