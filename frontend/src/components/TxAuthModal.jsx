import React from "react";
import {
  FiShield,
  FiAward,
  FiUser,
  FiDatabase,
  FiCheckCircle,
  FiXCircle,
  FiCpu
} from "react-icons/fi";
import { shortenWalletAddress } from "../services/metamask";

function TxAuthModal({ isOpen, updateDetails, walletAddress, onConfirm, onCancel, loading }) {
  if (!isOpen || !updateDetails) return null;

  return (
    <div className="auth-overlay">
      <div className="tx-auth-card">
        {/* Header */}
        <div className="tx-auth-header">
          <div className="tx-auth-icon">
            <FiShield />
          </div>
          <div>
            <h3>Authorize Blockchain Update</h3>
            <p>Explicit authorization is required before sending on-chain transaction.</p>
          </div>
        </div>

        {/* Details Summary */}
        <div className="tx-auth-details">
          <div className="tx-detail-row">
            <span className="tx-detail-label">
              <FiUser /> Student:
            </span>
            <strong className="tx-detail-value">{updateDetails.studentId}</strong>
          </div>

          <div className="tx-detail-row">
            <span className="tx-detail-label">
              <FiAward /> Certificate:
            </span>
            <strong className="tx-detail-value">
              {updateDetails.certificateName} ({updateDetails.certificateId})
            </strong>
          </div>

          <div className="tx-detail-row">
            <span className="tx-detail-label">
              <FiCpu /> Issuer:
            </span>
            <span className="tx-detail-value">{updateDetails.issuer}</span>
          </div>

          <div className="tx-detail-row highlight-row">
            <span className="tx-detail-label">
              <FiDatabase /> Network:
            </span>
            <span className="tx-network-badge">Ethereum Sepolia (Chain 11155111)</span>
          </div>

          <div className="tx-detail-row highlight-row">
            <span className="tx-detail-label">Signing Wallet:</span>
            <code className="tx-wallet-code">
              {shortenWalletAddress(walletAddress || "0x0000000000000000000000000000000000000000")}
            </code>
          </div>
        </div>

        {/* Info Note */}
        <div className="tx-auth-note">
          <p>
            Clicking <strong>Authorize</strong> will open your MetaMask extension to sign the Ethereum Sepolia transaction.
          </p>
        </div>

        {/* Actions */}
        <div className="tx-auth-actions">
          <button
            type="button"
            className="tx-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            <FiXCircle />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            className="tx-authorize-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            <FiCheckCircle />
            <span>{loading ? "Preparing Transaction..." : "Authorize Blockchain Update"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TxAuthModal;

