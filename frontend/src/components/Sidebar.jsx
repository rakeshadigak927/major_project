import {
  useEffect,
  useState,
} from "react";

import {
  FiHome,
  FiShare2,
  FiPlusCircle,
  FiClock,
  FiShield,
  FiDatabase,
  FiUsers,
  FiMenu,
  FiX,
} from "react-icons/fi";

import {
  NavLink,
} from "react-router-dom";

import MetaMaskWallet from "./MetaMaskWallet";

import {
  getConnectedAccounts,
  isWalletAdmin,
} from "../services/metamask";


function Sidebar() {

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);


  // =====================================================
  // CHECK WHETHER CURRENT WALLET IS ADMIN
  // =====================================================

  const checkAdminStatus = async () => {

    try {

      const accounts =
        await getConnectedAccounts();


      if (
        !accounts ||
        accounts.length === 0
      ) {

        setIsAdmin(false);

        return;

      }


      const admin =
        await isWalletAdmin(
          accounts[0]
        );


      setIsAdmin(
        admin
      );

    } catch (error) {

      console.error(
        "Admin check failed:",
        error
      );

      setIsAdmin(false);

    }

  };


  // =====================================================
  // INITIAL CHECK
  // =====================================================

  useEffect(() => {

    checkAdminStatus();

  }, []);


  // =====================================================
  // METAMASK EVENTS
  // =====================================================

  useEffect(() => {

    if (!window.ethereum) {

      return;

    }


    const handleAccountsChanged = () => {

      checkAdminStatus();

    };


    const handleChainChanged = () => {

      checkAdminStatus();

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


  // =====================================================
  // NORMAL NAVIGATION
  // =====================================================

  const navItems = [

    {
      path: "/",
      name: "Dashboard",
      icon: <FiHome />,
    },

    {
      path: "/graph",
      name: "Knowledge Graph",
      icon: <FiShare2 />,
    },

    {
      path: "/add",
      name: "Add Knowledge",
      icon: <FiPlusCircle />,
    },

    {
      path: "/history",
      name: "Evolution History",
      icon: <FiClock />,
    },

    {
      path: "/verify",
      name: "Blockchain Verify",
      icon: <FiShield />,
    },

  ];


  return (

    <>
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>


      {/* ========================================= */}
      {/* BRAND */}
      {/* ========================================= */}

      <div className="sidebar-brand">

        <div className="brand-icon">

          <FiShare2 />

        </div>


        <div>

          <h2>
            Decentralized KG
          </h2>

          <p>
            Blockchain Knowledge Graph
          </p>

        </div>

      </div>


      {/* ========================================= */}
      {/* NAVIGATION */}
      {/* ========================================= */}

      <nav className="sidebar-nav">

        <p className="sidebar-section-title">
          PLATFORM
        </p>


        {navItems.map(
          (item) => (

            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path === "/"
              }
              className={
                ({ isActive }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
              }
              onClick={() => setMobileOpen(false)}
            >

              <span className="sidebar-link-icon">

                {item.icon}

              </span>


              <span>
                {item.name}
              </span>

            </NavLink>

          )
        )}


        {/* ===================================== */}
        {/* ADMIN ONLY */}
        {/* ===================================== */}

        {isAdmin && (

          <NavLink
            to="/providers"
            className={
              ({ isActive }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
            }
            onClick={() => setMobileOpen(false)}
          >

            <span className="sidebar-link-icon">

              <FiUsers />

            </span>


            <span>
              Provider Management
            </span>

          </NavLink>

        )}


      </nav>


      {/* ========================================= */}
      {/* METAMASK */}
      {/* ========================================= */}

      <div className="sidebar-wallet-section">

        <p className="sidebar-section-title">
          WALLET
        </p>

        <MetaMaskWallet />

      </div>


      {/* ========================================= */}
      {/* BLOCKCHAIN */}
      {/* ========================================= */}

      <div className="sidebar-blockchain">

        <div className="blockchain-title">

          <FiDatabase />

          <span>
            BLOCKCHAIN
          </span>

        </div>


        <div className="network-status">

          <span className="status-dot">
          </span>


          <div>

            <strong>
              Ethereum Sepolia
            </strong>

            <p>
              Smart Contract Connected
            </p>

          </div>

        </div>

      </div>


      {/* ========================================= */}
      {/* FOOTER */}
      {/* ========================================= */}

      <div className="sidebar-footer">

        <p>
          Knowledge Graph Evolution
        </p>

        <span>
          Secured by Ethereum
        </span>

      </div>


    </aside>
    </>

  );

}


export default Sidebar;