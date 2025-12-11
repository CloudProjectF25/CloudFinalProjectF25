import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const DeleteModal = ({ show, item, onClose, onConfirm }) => {
  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content delete-modal">
        <div className="modal-header">
          <div className="modal-icon warning">
            <FaExclamationTriangle />
          </div>
          <h3 className="modal-title">Confirm Deletion</h3>
          <button onClick={onClose} className="modal-close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-message">
            Are you sure you want to delete item <strong>"{item?.inventoryId} - {item?.productName}"</strong>?
          </p>
          <div className="item-details">
            <div className="detail-row">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{item?.category}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Supplier:</span>
              <span className="detail-value">{item?.supplier}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cost:</span>
              <span className="detail-value">${item?.costUnit?.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Warehouse:</span>
              <span className="detail-value">{item?.warehouse}</span>
            </div>
          </div>
          <div className="warning-box">
            <FaExclamationTriangle className="warning-icon" />
            <p>This action cannot be undone. The item will be permanently removed from your inventory.</p>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn cancel-btn">
            Cancel
          </button>
          <button onClick={handleConfirm} className="modal-btn delete-btn">
            Delete Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;