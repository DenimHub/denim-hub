import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { 
  FaShoppingCart, 
  FaUser, 
  FaMobile, 
  FaEnvelope, 
  FaPercent,
  FaMoneyBillWave,
  FaCreditCard,
  FaQrcode,
  FaPrint,
  FaFilePdf,
  FaTimes,
  FaPlus,
  FaSms,
  FaWhatsapp
} from "react-icons/fa";

function Billing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [billItems, setBillItems] = useState([]);
  const [showBill, setShowBill] = useState(false);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [searchTerm, setSearchTerm] = useState("");
  
  // NEW: Communication options state
  const [sendSMS, setSendSMS] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    mobile: "",
    email: "",
  });

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/products");
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToBill = () => {
    const product = products.find((p) => p.id === Number(selectedProductId));

    if (!product) return alert("Select a product");
    if (quantity <= 0) return alert("Quantity must be at least 1");
    if (quantity > product.stockQty) return alert(`Only ${product.stockQty} items in stock`);

    // Check if product already in bill
    const existingItem = billItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Update quantity
      setBillItems(billItems.map(item => 
        item.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + quantity,
              total: (item.quantity + quantity) * item.price 
            }
          : item
      ));
    } else {
      // Add new item
      const itemTotal = product.price * quantity;

      setBillItems([
        ...billItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          total: itemTotal,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity(1);
    setSearchTerm("");
  };

  const removeFromBill = (productId) => {
    setBillItems(billItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromBill(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stockQty) {
      alert(`Only ${product.stockQty} items available`);
      return;
    }

    setBillItems(billItems.map(item => 
      item.id === productId 
        ? { 
            ...item, 
            quantity: newQuantity,
            total: newQuantity * item.price 
          }
        : item
    ));
  };

  const subTotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subTotal * discount) / 100;
  const finalAmount = subTotal - discountAmount;

  // Update the generateBill function - around line 150
const generateBill = async () => {
  if (!customer.name.trim()) return alert("Enter customer name");
  if (!customer.mobile.match(/^[0-9]{10}$/))
    return alert("Enter valid 10-digit mobile number");
  if (!customer.email.includes("@")) return alert("Enter valid email");

  if (billItems.length === 0) return alert("Add items to bill");

  try {
    const billData = {
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      discountPercent: discount,
      paymentMethod: paymentMethod,
      items: billItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })),
      sendSMS: sendSMS,
      sendEmail: sendEmail,
      sendWhatsApp: sendWhatsApp
    };

    console.log("Sending bill data:", billData);
    
    const response = await axios.post("http://localhost:8080/api/sales", billData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Bill generated - Full response:", response.data);
    
    // Handle different response structures
    let billData_response;
    if (response.data.sale) {
      // If response has a 'sale' property
      billData_response = response.data.sale;
    } else if (response.data.data) {
      // If response has a 'data' property
      billData_response = response.data.data;
    } else {
      // If response is directly the sale object
      billData_response = response.data;
    }
    
    console.log("Processed bill data:", billData_response);
    setGeneratedBill(billData_response);
    setShowBill(true);
    
    if (sendSMS) alert("✅ Bill sent via SMS!");
    if (sendEmail) alert("✅ Bill sent via Email!");
    if (sendWhatsApp) alert("✅ Bill sent via WhatsApp!");
    
  } catch (err) {
    console.error("Error generating bill:", err);
    
    if (err.response) {
      console.error("Error response:", err.response.data);
      alert(`Failed to generate bill: ${err.response.data.error || err.response.statusText}`);
    } else if (err.request) {
      alert("No response from server. Make sure backend is running on port 8080");
    } else {
      alert(`Error: ${err.message}`);
    }
  }
};

  const resetBill = () => {
    setBillItems([]);
    setDiscount(0);
    setShowBill(false);
    setGeneratedBill(null);
    setCustomer({ name: "", mobile: "", email: "" });
    // Reset communication options
    setSendSMS(false);
    setSendEmail(false);
    setSendWhatsApp(false);
    fetchProducts(); // Refresh stock
  };

  const printBill = () => {
    window.print();
  };

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <h3 className="mb-4">Billing</h3>

        {/* Customer Details */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="mb-3">
              <FaUser className="me-2" />
              Customer Details
            </h5>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">
                  <FaUser className="me-2" />
                  Name *
                </label>
                <input
                  className="form-control"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer({ ...customer, name: e.target.value })
                  }
                  placeholder="Enter customer name"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  <FaMobile className="me-2" />
                  Mobile *
                </label>
                <input
                  className="form-control"
                  value={customer.mobile}
                  onChange={(e) =>
                    setCustomer({ ...customer, mobile: e.target.value })
                  }
                  placeholder="10-digit mobile number"
                  maxLength="10"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  <FaEnvelope className="me-2" />
                  Email *
                </label>
                <input
                  className="form-control"
                  value={customer.email}
                  onChange={(e) =>
                    setCustomer({ ...customer, email: e.target.value })
                  }
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="mb-3">
              <FaShoppingCart className="me-2" />
              Add Products
            </h5>

            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label>Search & Select Product</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="form-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  size="3"
                >
                  <option value="">Select Product</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.price} (Stock: {p.stockQty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label>Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                />
              </div>

              <div className="col-md-3">
                <button className="btn btn-primary w-100" onClick={addToBill}>
                  <FaPlus className="me-2" />
                  Add to Bill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Items */}
        {billItems.length > 0 && !showBill && (
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Current Bill</h5>

              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Price (₹)</th>
                      <th>Quantity</th>
                      <th>Total (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>₹{item.price}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: "80px" }}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                            min="0"
                          />
                        </td>
                        <td>₹{item.total}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => removeFromBill(item.id)}
                          >
                            <FaTimes />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row mt-4">
                <div className="col-md-4">
                  <label className="form-label">
                    <FaPercent className="me-2" />
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    <FaMoneyBillWave className="me-2" />
                    Payment Method
                  </label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              {/* NEW: Communication Options Section - ADD THIS HERE */}
              <div className="row mt-3">
                <div className="col-12">
                  <label className="form-label fw-bold">Send Bill To Customer:</label>
                  <div className="d-flex gap-4 flex-wrap">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="sendSMS"
                        checked={sendSMS}
                        onChange={(e) => setSendSMS(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="sendSMS">
                        <FaSms className="text-primary me-1" />
                        Send SMS
                      </label>
                    </div>
                    
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="sendEmail"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="sendEmail">
                        <FaEnvelope className="text-danger me-1" />
                        Send Email
                      </label>
                    </div>
                    
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="sendWhatsApp"
                        checked={sendWhatsApp}
                        onChange={(e) => setSendWhatsApp(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="sendWhatsApp">
                        <FaWhatsapp className="text-success me-1" />
                        Send WhatsApp
                      </label>
                    </div>
                  </div>
                  <small className="text-muted d-block mt-2">
                    Bill will be sent to {customer.mobile || 'customer'} if options are selected
                  </small>
                </div>
              </div>

              <div className="mt-4 p-3 bg-light rounded">
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1">Subtotal: ₹{subTotal}</p>
                    <p className="mb-1">Discount ({discount}%): ₹{discountAmount.toFixed(2)}</p>
                    <h4 className="mt-3">Total: ₹{finalAmount.toFixed(2)}</h4>
                  </div>
                  <div className="col-md-6 text-end">
                    <button className="btn btn-success btn-lg" onClick={generateBill}>
                      Generate Bill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Bill */}
        {showBill && generatedBill && (
  <div className="card shadow-sm" id="bill-print">
    <div className="card-body">
      <div className="text-center mb-4">
        <h2>Denim Hub</h2>
        <p className="text-muted">Your Denim Store</p>
        <h4>Tax Invoice</h4>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <h6>Bill To:</h6>
          <p className="mb-1"><strong>{generatedBill.customer?.name || customer.name}</strong></p>
          <p className="mb-1">Mobile: {generatedBill.customer?.mobile || customer.mobile}</p>
          <p className="mb-1">Email: {generatedBill.customer?.email || customer.email}</p>
        </div>
        <div className="col-md-6 text-end">
          <h6>Bill Details:</h6>
          <p className="mb-1">Bill No: {generatedBill.saleNo || 'N/A'}</p>
          <p className="mb-1">Date: {generatedBill.billDate ? new Date(generatedBill.billDate).toLocaleString() : new Date().toLocaleString()}</p>
          <p className="mb-1">Payment: {generatedBill.paymentMethod || paymentMethod}</p>
        </div>
      </div>

      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {generatedBill.items && generatedBill.items.length > 0 ? (
            generatedBill.items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.product?.name || item.name || 'N/A'}</td>
                <td>₹{item.price || 0}</td>
                <td>{item.quantity || 0}</td>
                <td>₹{item.total || 0}</td>
              </tr>
            ))
          ) : (
            // If no items in response, show from billItems
            billItems.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>₹{item.price}</td>
                <td>{item.quantity}</td>
                <td>₹{item.total}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="row">
        <div className="col-md-6">
          <p className="mb-1">Total Items: {generatedBill.totalItems || billItems.length}</p>
        </div>
        <div className="col-md-6 text-end">
          <p className="mb-1">Subtotal: ₹{generatedBill.subtotal || subTotal}</p>
          <p className="mb-1">Discount: ₹{generatedBill.discountAmount || discountAmount.toFixed(2)}</p>
          <h4>Grand Total: ₹{generatedBill.totalAmount || finalAmount.toFixed(2)}</h4>
        </div>
      </div>

      {/* Show communication status */}
      {(sendSMS || sendEmail || sendWhatsApp) && (
        <div className="alert alert-success mt-3">
          <small>
            ✅ Bill sent via:{' '}
            {sendSMS && ' SMS '}
            {sendEmail && ' Email '}
            {sendWhatsApp && ' WhatsApp '}
          </small>
        </div>
      )}

      <hr />
      
      <div className="text-center mb-3">
        <p className="text-muted">Thank you for shopping with us!</p>
        <p className="text-muted">** This is a computer generated invoice **</p>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-primary" onClick={printBill}>
          <FaPrint className="me-2" />
          Print Bill
        </button>
        <button className="btn btn-success" onClick={resetBill}>
          New Bill
        </button>
      </div>
    </div>
  </div>
)}

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Billing;