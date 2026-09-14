import axios from "axios";


// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL =
  (import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api/graph").replace(/\/$/, "");

// Auth endpoints live one level above /api/graph.
const API_ROOT_URL = API_BASE_URL.replace(/\/graph$/, "");

const api = axios.create({

  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 60000,

});


// =====================================================
// AUTHENTICATION
// =====================================================

const authHeaders = () => {
  const token = localStorage.getItem("dkg_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const loginWithEmailApi = async (credentials) => {
  const response = await axios.post(`${API_ROOT_URL}/auth/login`, credentials, { timeout: 60000 });
  return response.data;
};

export const registerWithEmailApi = async (userData) => {
  const response = await axios.post(`${API_ROOT_URL}/auth/register`, userData, { timeout: 60000 });
  return response.data;
};

export const googleAuthApi = async (googleData) => {
  const response = await axios.post(`${API_ROOT_URL}/auth/google`, googleData, { timeout: 60000 });
  return response.data;
};

export const getPasskeyRegisterOptionsApi = async () => {
  const response = await axios.post(`${API_ROOT_URL}/auth/passkey/register-options`, {}, { headers: authHeaders(), timeout: 60000 });
  return response.data;
};

export const verifyPasskeyRegisterApi = async (credential) => {
  const response = await axios.post(`${API_ROOT_URL}/auth/passkey/register-verify`, { credential }, { headers: authHeaders(), timeout: 60000 });
  return response.data;
};

export const getPasskeyLoginOptionsApi = async (email) => {
  const response = await axios.post(`${API_ROOT_URL}/auth/passkey/login-options`, { email }, { timeout: 60000 });
  return response.data;
};

export const verifyPasskeyLoginApi = async (credential) => {
  const response = await axios.post(`${API_ROOT_URL}/auth/passkey/login-verify`, { credential }, { timeout: 60000 });
  return response.data;
};

export const getCurrentUserApi = async () => {
  const response = await axios.get(`${API_ROOT_URL}/auth/me`, { headers: authHeaders(), timeout: 60000 });
  return response.data;
};


// =====================================================
// STUDENTS
// =====================================================

export const getStudents = async () => {

  const response =
    await api.get("/students");

  return response.data;

};


export const getStudent = async (
  studentId
) => {

  const response =
    await api.get(
      `/students/${encodeURIComponent(
        studentId
      )}`
    );

  return response.data;

};


// =====================================================
// OLD ADD KNOWLEDGE
//
// Keep this temporarily as fallback.
// This uses the BACKEND wallet.
// =====================================================

export const addKnowledge = async (
  knowledgeData
) => {

  const response =
    await api.post(
      "/add-knowledge",
      knowledgeData
    );

  return response.data;

};


// =====================================================
// METAMASK — PREPARE KNOWLEDGE
//
// Does NOT send a blockchain transaction.
//
// Backend:
// 1. validates data
// 2. creates pending Neo4j update
// 3. generates canonical SHA-256 hash
// 4. returns hash + metadata
// =====================================================

export const prepareMetaMaskKnowledge =
  async (knowledgeData) => {

    const response =
      await api.post(
        "/metamask/prepare",
        knowledgeData
      );

    return response.data;

  };


// =====================================================
// METAMASK — CONFIRM BLOCKCHAIN TRANSACTION
//
// Called AFTER MetaMask transaction is mined.
//
// Backend independently checks:
// - transaction receipt
// - contract address
// - blockchain update ID
// - data hash
// - wallet address
// - smart contract verification
// =====================================================

export const confirmMetaMaskKnowledge =
  async (confirmationData) => {

    const response =
      await api.post(
        "/metamask/confirm",
        confirmationData
      );

    return response.data;

  };


// =====================================================
// EVOLUTION HISTORY
// =====================================================

export const getEvolutionHistory =
  async () => {

    const response =
      await api.get(
        "/evolution-history"
      );

    return response.data;

  };


// =====================================================
// GET GRAPH UPDATE
// =====================================================

export const getUpdate = async (
  updateId
) => {

  const response =
    await api.get(
      `/updates/${encodeURIComponent(
        updateId
      )}`
    );

  return response.data;

};


// =====================================================
// VERIFY BLOCKCHAIN UPDATE
// =====================================================

export const verifyUpdate = async (
  updateId
) => {

  const response =
    await api.get(
      `/verify/${encodeURIComponent(
        updateId
      )}`
    );

  return response.data;

};


// =====================================================
// BLOCKCHAIN STATUS
// =====================================================

export const getBlockchainStatus =
  async () => {

    const response =
      await api.get(
        "/blockchain/status"
      );

    return response.data;

  };


// =====================================================
// BLOCKCHAIN RECORD
// =====================================================

export const getBlockchainUpdate =
  async (id) => {

    const response =
      await api.get(
        `/blockchain/updates/${encodeURIComponent(
          id
        )}`
      );

    return response.data;

  };


// =====================================================
// STATISTICS
// =====================================================

export const getStatistics =
  async () => {

    const response =
      await api.get(
        "/stats"
      );

    return response.data;

  };


// =====================================================
// ERROR HELPER
// =====================================================

export const getApiErrorMessage = (
  error
) => {

  if (
    error.response?.data?.message
  ) {

    return error.response.data.message;

  }


  if (
    error.code === "ECONNABORTED"
  ) {

    return (
      "The request took too long. " +
      "Please try again."
    );

  }


  if (error.request) {

    return (
      "Unable to connect to the backend server."
    );

  }


  return (
    error.message ||
    "Something went wrong."
  );

};


// =====================================================
// EXPORT AXIOS INSTANCE
// =====================================================

export default api;