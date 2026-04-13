import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { FaUser, FaMobile, FaEnvelope, FaShoppingBag, FaCalendar, FaRupeeSign, FaPrint, FaEye } from "react-icons/fa";

function CustomerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
    fetchCustomerOrders();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/customers/${id}`);
      setCustomer(response.data);
    } catch (err) {
      console.error("Error fetching customer:", err);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/customers/${id}/orders`);
      setOrders(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewBill = async (billId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/bills/${billId}`);
      setSelectedBill(response.data);
      setShowBillModal(true);
    } catch (err) {
      console.error("Error fetching bill:", err);
      alert("Failed to load bill details");
    }
  };

  const printBill = (bill) => {
    const printWindow = window.open('', '_blank');
    const customerName = bill.customer?.name || 'Customer';
    const customerMobile = bill.customer?.mobile || 'N/A';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill ${bill.saleNo}</title>
          <style>
            body { font-family: Arial; padding: 30px; margin: 0; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #072685; padding-bottom: 20px; }
            .header h1 { color: #072685; margin: 0; font-size: 32px; }
            .header p { color: #666; margin: 5px 0 0; }
            .customer-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #072685; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #072685; color: white; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 10px; }
            .summary { text-align: right; margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Denim Hub</h1>
            <p>Your Denim Store</p>
            <h3>Tax Invoice</h3>
          </div>
          
          <div class="customer-details">
            <p><strong>Bill No:</strong> ${bill.saleNo}</p>
            <p><strong>Date:</strong> ${new Date(bill.billDate).toLocaleString()}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Mobile:</strong> ${customerMobile}</p>
            <p><strong>Payment:</strong> ${bill.paymentMethod}</p>
          </div>
          
          <table>
            <thead>
              <tr><th>#</th><th>Product</th><th>Size</th><th>Price</th><th>Qty</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${bill.items?.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product?.name || 'N/A'}</td>
                  <td>${item.size || '-'}</td>
                  <td>₹${item.price}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <p><strong>Subtotal:</strong> ₹${bill.subtotal}</p>
            <p><strong>Discount:</strong> ₹${bill.discountAmount || 0}</p>
            <h3>Grand Total: ₹${bill.totalAmount}</h3>
          </div>
          
          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>** This is a computer generated invoice **</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="d-flex vh-100">
        <Sidebar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />
      <div className="flex-grow-1 p-4 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Customer Profile</h3>
          <button className="btn btn-secondary" onClick={() => navigate("/customers")}>
            ← Back to Customers
          </button>
        </div>

        {/* Customer Information Card */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <h4 className="mb-3">
                  <FaUser className="text-primary me-2" />
                  {customer?.name}
                </h4>
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-2">
                      <FaMobile className="text-muted me-2" />
                      <strong>Mobile:</strong> {customer?.mobile}
                    </p>
                    <p className="mb-2">
                      <FaEnvelope className="text-muted me-2" />
                      <strong>Email:</strong> {customer?.email || "Not provided"}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-2">
                      <FaCalendar className="text-muted me-2" />
                      <strong>Customer Since:</strong> {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="mb-2">
                      <FaShoppingBag className="text-muted me-2" />
                      <strong>Total Orders:</strong> {customer?.totalOrders || 0}
                    </p>
                    <p className="mb-2">
                      <FaRupeeSign className="text-muted me-2" />
                      <strong>Total Spent:</strong> ₹{(customer?.totalSpent || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-end">
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <h6 className="text-muted">Loyalty Status</h6>
                  <h4 className="text-primary">
                    {(customer?.totalSpent || 0) > 10000 ? "🥇 Gold" : 
                     (customer?.totalSpent || 0) > 5000 ? "🥈 Silver" : "🥉 Bronze"}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders History */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0">
              <FaShoppingBag className="me-2" />
              Purchase History
            </h5>
          </div>
          <div className="card-body p-0">
            {orders.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Bill No</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Subtotal</th>
                      <th>Discount</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>{order.saleNo}</strong></td>
                        <td>{new Date(order.billDate).toLocaleDateString()}</td>
                        <td>{order.totalItems}</td>
                        <td>₹{order.subtotal}</td>
                        <td>₹{order.discountAmount || 0}</td>
                        <td className="fw-bold text-success">₹{order.totalAmount}</td>
                        <td><span className="badge bg-info">{order.paymentMethod}</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => viewBill(order.id)}>
                            <FaEye /> View
                          </button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => printBill(order)}>
                            <FaPrint /> Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">No purchase history found</p>
              </div>
            )}
          </div>
        </div>

        {/* Bill Details Modal */}
        {showBillModal && selectedBill && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Bill Details - {selectedBill.saleNo}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowBillModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p><strong>Customer:</strong> {selectedBill.customer?.name}</p>
                      <p><strong>Mobile:</strong> {selectedBill.customer?.mobile}</p>
                    </div>
                    <div className="col-md-6 text-end">
                      <p><strong>Date:</strong> {new Date(selectedBill.billDate).toLocaleString()}</p>
                      <p><strong>Payment:</strong> {selectedBill.paymentMethod}</p>
                    </div>
                  </div>
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr><th>#</th><th>Product</th><th>Size</th><th>Price</th><th>Qty</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {selectedBill.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{item.product?.name}</td>
                          <td>{item.size}</td>
                          <td>₹{item.price}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-end mt-3">
                    <p>Subtotal: ₹{selectedBill.subtotal}</p>
                    <p>Discount: ₹{selectedBill.discountAmount || 0}</p>
                    <h4>Grand Total: ₹{selectedBill.totalAmount}</h4>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={() => printBill(selectedBill)}>
                    <FaPrint /> Print Bill
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowBillModal(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerView;