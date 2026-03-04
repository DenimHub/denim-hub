import Sidebar from "../components/Sidebar";
import { FaSearch, FaEye, FaEdit, FaTrash, FaSync, FaUserPlus } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Fetch customers from database
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching customers...");
      
      const response = await axios.get("http://localhost:8080/api/customers");
      console.log("Customers received:", response.data);
      
      // Ensure we have an array
      setCustomers(Array.isArray(response.data) ? response.data : []);
      
    } catch (err) {
      console.error("Error fetching customers:", err);
      
      if (err.response) {
        if (err.response.status === 403) {
          setError("Access forbidden. Please check backend security configuration.");
        } else {
          setError(`Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError("Cannot connect to server. Make sure backend is running on port 8080");
      } else {
        setError(`Error: ${err.message}`);
      }
      
      // Set empty array on error
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/customers/${deleteId}`);
      setCustomers(customers.filter((c) => c.id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert("Failed to delete customer. They might have existing bills.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleEditClick = (customer) => {
    setEditCustomer({ ...customer });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditCustomer({ ...editCustomer, [name]: value });
  };

  const saveEdit = async () => {
    try {
      const response = await axios.put(
        `http://localhost:8080/api/customers/${editCustomer.id}`,
        editCustomer
      );
      
      setCustomers(
        customers.map((c) => (c.id === editCustomer.id ? response.data : c))
      );
      setShowEditModal(false);
      setEditCustomer(null);
    } catch (err) {
      console.error("Error updating customer:", err);
      alert("Failed to update customer");
    }
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditCustomer(null);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile?.includes(searchTerm)
  );

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Customers</h3>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-primary"
              onClick={fetchCustomers}
              disabled={loading}
            >
              <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="input-group mb-3" style={{ maxWidth: "400px" }}>
          <span className="input-group-text">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email or mobile"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-3">
            <FaSync className="me-2" />
            <div className="flex-grow-1">{error}</div>
            <button className="btn btn-sm btn-outline-danger" onClick={fetchCustomers}>
              Retry
            </button>
          </div>
        )}

        {/* Customers Table */}
        <div className="card shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Customer List</h5>
            <div className="text-muted small">
              Total: {customers.length} customers
            </div>
          </div>
          
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Joined</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.id}</td>
                          <td>
                            <strong>{customer.name}</strong>
                          </td>
                          <td>{customer.email || '-'}</td>
                          <td>{customer.mobile}</td>
                          <td className="text-center">
                            <span className="badge bg-info">{customer.totalOrders || 0}</span>
                          </td>
                          <td>₹{(customer.totalSpent || 0).toFixed(2)}</td>
                          <td>
                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="text-center">
                            <FaEye
                              className="text-primary me-3 cursor-pointer"
                              style={{ cursor: 'pointer' }}
                              onClick={() =>
                                navigate(`/customers/view/${customer.id}`)
                              }
                              title="View Details"
                            />
                            <FaEdit
                              className="text-warning me-3 cursor-pointer"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEditClick(customer)}
                              title="Edit Customer"
                            />
                            <FaTrash
                              className="text-danger cursor-pointer"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleDeleteClick(customer.id)}
                              title="Delete Customer"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          {searchTerm ? "No customers match your search" : "No customers found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && editCustomer && (
          <>
            <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Customer</h5>
                    <button type="button" className="btn-close" onClick={cancelEdit}></button>
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Name</label>
                        <input
                          className="form-control"
                          name="name"
                          value={editCustomer.name || ''}
                          onChange={handleEditChange}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Email</label>
                        <input
                          className="form-control"
                          name="email"
                          type="email"
                          value={editCustomer.email || ''}
                          onChange={handleEditChange}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Mobile</label>
                        <input
                          className="form-control"
                          name="mobile"
                          value={editCustomer.mobile || ''}
                          onChange={handleEditChange}
                          maxLength="10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={saveEdit}>
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <>
            <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button type="button" className="btn-close" onClick={cancelDelete}></button>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to delete this customer?</p>
                    <p className="text-danger mb-0">This action cannot be undone.</p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={cancelDelete}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Customers;