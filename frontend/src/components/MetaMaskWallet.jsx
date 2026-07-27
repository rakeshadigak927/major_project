import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import {
  connectMetaMask,
  getConnectedAccounts,
  getCurrentNetwork,
  getWalletBalance,
  checkAuthorization,
  shortenWalletAddress,
  getMetaMaskErrorMessage,
  isMetaMaskInstalled,
} from "../services/metamask";


function MetaMaskWallet() {

  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [network, setNetwork] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // ==============================================
  // LOAD WALLET INFORMATION
  // ==============================================

  const loadWalletInfo = async (
    walletAddress
  ) => {

    try {

      const [
        networkInfo,
        walletBalance,
        authorizationStatus,
      ] = await Promise.all([

        getCurrentNetwork(),

        getWalletBalance(
          walletAddress
        ),

        checkAuthorization(
          walletAddress
        ),

      ]);


      setAddress(
        walletAddress
      );

      setNetwork(
        networkInfo
      );

      setBalance(
        Number(walletBalance)
          .toFixed(5)
      );

      setAuthorized(
        authorizationStatus
      );


    } catch (err) {

      console.error(
        "Wallet information error:",
        err
      );

      setError(
        getMetaMaskErrorMessage(err)
      );

    }

  };


  // ==============================================
  // CHECK EXISTING CONNECTION
  // ==============================================

  useEffect(() => {

    const checkExistingWallet =
      async () => {

        if (
          !isMetaMaskInstalled()
        ) {

          return;

        }


        try {

          const accounts =
            await getConnectedAccounts();


          if (
            accounts.length > 0
          ) {

            await loadWalletInfo(
              accounts[0]
            );

          }

        } catch (err) {

          console.error(
            err
          );

        }

      };


    checkExistingWallet();

  }, []);


  // ==============================================
  // CONNECT METAMASK
  // ==============================================

  const handleConnect =
    async () => {

      try {

        setLoading(true);
        setError("");


        const wallet =
          await connectMetaMask();


        await loadWalletInfo(
          wallet.address
        );


      } catch (err) {

        setError(
          getMetaMaskErrorMessage(err)
        );


      } finally {

        setLoading(false);

      }

    };


  // ==============================================
  // ACCOUNT / NETWORK CHANGE
  // ==============================================

  useEffect(() => {

    if (
      !window.ethereum
    ) {

      return;

    }


    const handleAccountsChanged =
      async (accounts) => {

        setError("");


        if (
          !accounts ||
          accounts.length === 0
        ) {

          setAddress("");
          setBalance("");
          setAuthorized(false);

          return;

        }


        await loadWalletInfo(
          accounts[0]
        );

      };


    const handleChainChanged =
      () => {

        window.location.reload();

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


  // ==============================================
  // METAMASK NOT INSTALLED
  // ==============================================

  if (
    !isMetaMaskInstalled()
  ) {

    return (

      <div className="metamask-card">

        <div className="metamask-logo">
          🦊
        </div>


        <div className="metamask-main">

          <strong>
            MetaMask
          </strong>

          <span className="wallet-error">
            Not installed
          </span>

        </div>

      </div>

    );

  }


  // ==============================================
  // NOT CONNECTED
  // ==============================================

  if (!address) {

    return (

      <div>

        <div className="metamask-card">

          <div className="metamask-logo">
            🦊
          </div>


          <div className="metamask-main">

            <strong>
              MetaMask
            </strong>

            <span>
              Wallet not connected
            </span>

          </div>


          <button
            className="metamask-connect-button"
            onClick={
              handleConnect
            }
            disabled={
              loading
            }
          >

            {loading ? (

              <>

                <FiRefreshCw
                  className="spin-icon"
                />

                Connecting

              </>

            ) : (

              "Connect"

            )}

          </button>

        </div>


        {error && (

          <div className="metamask-error">

            <FiAlertCircle />

            {error}

          </div>

        )}

      </div>

    );

  }


  // ==============================================
  // CONNECTED
  // ==============================================

  return (

    <div>

      <div className="metamask-card connected">


        <div className="metamask-logo">
          🦊
        </div>


        <div className="metamask-main">

          <div className="metamask-title">

            <strong>
              MetaMask
            </strong>


            <span className="wallet-connected">

              <FiCheckCircle />

              Connected

            </span>

          </div>


          <code>

            {
              shortenWalletAddress(
                address
              )
            }

          </code>


          <div className="wallet-details">

            <span>

              {
                network?.isSepolia
                  ? "Sepolia"
                  : `Chain ${network?.chainId}`
              }

            </span>


            <span>
              {balance} ETH
            </span>

          </div>


          <div
            className={
              authorized
                ? "wallet-authorized"
                : "wallet-unauthorized"
            }
          >

            {
              authorized
                ? "Authorized Provider"
                : "Not Authorized"
            }

          </div>

        </div>


      </div>


      {error && (

        <div className="metamask-error">

          <FiAlertCircle />

          {error}

        </div>

      )}


    </div>

  );

}


export default MetaMaskWallet;