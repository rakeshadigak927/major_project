import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import AddKnowledge from "./pages/AddKnowledge";
import EvolutionHistory from "./pages/EvolutionHistory";
import BlockchainVerification from "./pages/BlockchainVerification";

// NEW
import ProviderManagement from "./pages/ProviderManagement";


function App() {

  return (

    <BrowserRouter>

      <div className="app-layout">

        {/* ========================================= */}
        {/* SIDEBAR */}
        {/* ========================================= */}

        <Sidebar />


        {/* ========================================= */}
        {/* MAIN CONTENT */}
        {/* ========================================= */}

        <main className="main-content">

          <Routes>

            {/* DASHBOARD */}

            <Route
              path="/"
              element={
                <Dashboard />
              }
            />


            {/* KNOWLEDGE GRAPH */}

            <Route
              path="/graph"
              element={
                <KnowledgeGraph />
              }
            />


            {/* ADD KNOWLEDGE */}

            <Route
              path="/add"
              element={
                <AddKnowledge />
              }
            />


            {/* EVOLUTION HISTORY */}

            <Route
              path="/history"
              element={
                <EvolutionHistory />
              }
            />


            {/* BLOCKCHAIN VERIFICATION */}

            <Route
              path="/verify"
              element={
                <BlockchainVerification />
              }
            />


            {/* ===================================== */}
            {/* PROVIDER MANAGEMENT */}
            {/* ===================================== */}

            <Route
              path="/providers"
              element={
                <ProviderManagement />
              }
            />


            {/* 404 */}

            <Route
              path="*"
              element={

                <div className="page-state">

                  <h2>
                    Page Not Found
                  </h2>

                  <p>
                    The requested page
                    does not exist.
                  </p>

                </div>

              }
            />

          </Routes>

        </main>

      </div>

    </BrowserRouter>

  );

}


export default App;