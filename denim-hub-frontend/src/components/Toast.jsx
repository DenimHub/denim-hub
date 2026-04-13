import { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-success me-2" size={20} />;
      case "error":
        return <FaTimesCircle className="text-danger me-2" size={20} />;
      case "warning":
        return <FaExclamationTriangle className="text-warning me-2" size={20} />;
      default:
        return <FaInfoCircle className="text-info me-2" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "#d4edda";
      case "error":
        return "#f8d7da";
      case "warning":
        return "#fff3cd";
      default:
        return "#d1ecf1";
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      animation: "slideIn 0.3s ease-out"
    }}>
      <div style={{
        background: getBgColor(),
        borderLeft: `4px solid ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : type === "warning" ? "#ffc107" : "#17a2b8"}`,
        borderRadius: "8px",
        padding: "12px 20px",
        minWidth: "300px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div className="d-flex align-items-center">
          {getIcon()}
          <span>{message}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>&times;</button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Toast;