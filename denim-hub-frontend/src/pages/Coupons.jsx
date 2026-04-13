import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { FaTicketAlt, FaPlus, FaTrash, FaSync } from "react-icons/fa";
import { useToast } from "../context/ToastContext";
import { useDarkMode } from "../context/DarkModeContext";

function Coupons() {
    const { darkMode } = useDarkMode();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteCode, setDeleteCode] = useState("");
  const { showToast } = useToast();
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    companyName: "",
    contactPerson: "",
    email: "",
    discountPercent: "",
    validFrom: "",
    validUntil: "",
    usageLimit: ""
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/coupons");
      setCoupons(response.data);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      showToast("❌ Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async () => {
    if (!newCoupon.code.trim()) {
      showToast("❌ Please enter coupon code", "warning");
      return;
    }
    if (!newCoupon.companyName.trim()) {
      showToast("❌ Please enter company name", "warning");
      return;
    }
    if (!newCoupon.discountPercent || newCoupon.discountPercent <= 0) {
      showToast("❌ Please enter valid discount percentage", "warning");
      return;
    }
    if (newCoupon.discountPercent < 0 || newCoupon.discountPercent > 100) {
      showToast("❌ Discount must be between 0 and 100", "warning");
      return;
    }
    if (!newCoupon.validFrom) {
      showToast("❌ Please select valid from date", "warning");
      return;
    }
    if (!newCoupon.validUntil) {
      showToast("❌ Please select valid until date", "warning");
      return;
    }

    let formattedCode = newCoupon.code.toUpperCase();
    if (!formattedCode.startsWith("DH-")) {
      formattedCode = `DH-${formattedCode}`;
    }

    const couponData = {
      code: formattedCode,
      companyName: newCoupon.companyName,
      contactPerson: newCoupon.contactPerson || "",
      email: newCoupon.email || "",
      discountPercent: parseFloat(newCoupon.discountPercent),
      validFrom: newCoupon.validFrom,
      validUntil: newCoupon.validUntil,
      usageLimit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : null
    };

    try {
      await axios.post("http://localhost:8080/api/coupons", couponData);
      showToast(`✅ Coupon "${formattedCode}" added successfully!`, "success");
      setShowAddModal(false);
      setNewCoupon({
        code: "",
        companyName: "",
        contactPerson: "",
        email: "",
        discountPercent: "",
        validFrom: "",
        validUntil: "",
        usageLimit: ""
      });
      fetchCoupons();
    } catch (err) {
      console.error("Error adding coupon:", err);
      if (err.response?.status === 400) {
        showToast("❌ Invalid coupon data. Please check all fields.", "error");
      } else if (err.response?.status === 409) {
        showToast("❌ Coupon code already exists! Please use a different code.", "error");
      } else {
        showToast("❌ Failed to add coupon. Please try again.", "error");
      }
    }
  };

  const confirmDelete = (id, code) => {
    setDeleteId(id);
    setDeleteCode(code);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/coupons/${deleteId}`);
      showToast(`✅ Coupon "${deleteCode}" deleted successfully!`, "success");
      setShowDeleteConfirm(false);
      setDeleteId(null);
      setDeleteCode("");
      fetchCoupons();
    } catch (err) {
      console.error("Error deleting coupon:", err);
      showToast("❌ Failed to delete coupon", "error");
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
    setDeleteCode("");
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  return (
     <div className={`d-flex vh-100 overflow-hidden ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar />
      <div className={`flex-grow-1 p-4 overflow-auto ${darkMode ? 'dark-mode' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0"><FaTicketAlt className="me-2" />Coupon Management</h3>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <FaPlus className="me-2" />Add Coupon
            </button>
            <button className="btn btn-outline-primary" onClick={fetchCoupons} disabled={loading}>
              <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} />Refresh
            </button>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0">All Coupons</h5>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Code</th>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Discount</th>
                      <th>Valid From</th>
                      <th>Valid Until</th>
                      <th>Status</th>
                      <th>Uses</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length > 0 ? (
                      coupons.map(coupon => {
                        const expired = isExpired(coupon.validUntil);
                        return (
                          <tr key={coupon.id}>
                            <td><strong className="text-primary">{coupon.code}</strong></td>
                            <td>{coupon.companyName}</td>
                            <td>{coupon.contactPerson || "-"}<br/><small>{coupon.email || "-"}</small></td>
                            <td><span className="badge bg-success">{coupon.discountPercent}%</span></td>
                            <td>{new Date(coupon.validFrom).toLocaleDateString()}</td>
                            <td>{new Date(coupon.validUntil).toLocaleDateString()}</td>
                            <td>{expired ? <span className="badge bg-danger">Expired</span> : <span className="badge bg-success">Active</span>}</td>
                            <td>{coupon.usedCount || 0} / {coupon.usageLimit || "∞"}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(coupon.id, coupon.code)}>
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4">No coupons found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Coupon Modal */}
        {showAddModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Add New Coupon</h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Coupon Code *</label>
                    <input type="text" className="form-control" placeholder="e.g., SUMMER25" 
                      value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} />
                    <small className="text-muted">Will be prefixed with DH- automatically</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Company Name *</label>
                    <input type="text" className="form-control" value={newCoupon.companyName}
                      onChange={(e) => setNewCoupon({ ...newCoupon, companyName: e.target.value })} />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Contact Person</label>
                      <input type="text" className="form-control" value={newCoupon.contactPerson}
                        onChange={(e) => setNewCoupon({ ...newCoupon, contactPerson: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={newCoupon.email}
                        onChange={(e) => setNewCoupon({ ...newCoupon, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Discount Percentage *</label>
                    <input type="number" className="form-control" value={newCoupon.discountPercent}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })} min="0" max="100" step="1" />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Valid From *</label>
                      <input type="date" className="form-control" value={newCoupon.validFrom}
                        onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Valid Until *</label>
                      <input type="date" className="form-control" value={newCoupon.validUntil}
                        onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Usage Limit (Optional)</label>
                    <input type="number" className="form-control" placeholder="Unlimited if empty" value={newCoupon.usageLimit}
                      onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })} min="1" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleAddCoupon}>Add Coupon</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button className="btn-close btn-close-white" onClick={cancelDelete}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this coupon?</p>
                  <p className="fw-bold text-danger">Coupon Code: {deleteCode}</p>
                  <p className="text-muted">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={cancelDelete}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Coupons;