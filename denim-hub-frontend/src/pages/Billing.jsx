import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useToast } from "../context/ToastContext";
import axios from "axios";
import { useDarkMode } from "../context/DarkModeContext";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  FaShoppingCart, FaUser, FaMobile, FaEnvelope, FaPercent,
  FaMoneyBillWave, FaPrint, FaTimes, FaPlus, FaSms, FaWhatsapp, 
  FaTicketAlt, FaCheckCircle, FaGift, FaDownload, FaMoon, FaSun, FaMicrophone, FaStop
} from "react-icons/fa";

function Billing() {
  const { darkMode } = useDarkMode();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [billItems, setBillItems] = useState([]);
  const [showBill, setShowBill] = useState(false);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [sendSMS, setSendSMS] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  
 
  // Voice Search State
  const [isListening, setIsListening] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    mobile: "",
    email: "",
  });

  useEffect(() => {
    fetchProducts();
   
  }, []);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem("darkMode", !darkMode);
    document.body.classList.toggle("dark-mode");
  };

  // Voice Search Function
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      showToast("❌ Voice search not supported in this browser", "warning");
      return;
    }
    
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
      showToast("🎤 Listening... Speak the product name", "info");
    };
    
    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setSearchTerm(voiceText);
      showToast(`🔍 Searching for: "${voiceText}"`, "success");
      setIsListening(false);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      showToast("❌ Could not recognize. Please try again.", "error");
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/products");
      setProducts(response.data);
    } catch (err) {
      showToast("❌ Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  useEffect(() => {
    setSelectedSize("");
  }, [selectedProductId]);

  const handleMobileChange = async (mobile) => {
    setCustomer(prev => ({ ...prev, mobile }));
    if (mobile.length >= 5) {
      try {
        const response = await axios.get(`http://localhost:8080/api/customers/search?mobile=${mobile}`);
        setCustomerSuggestions(response.data);
      } catch (err) {
        setCustomerSuggestions([]);
      }
    } else {
      setCustomerSuggestions([]);
    }
  };

  const selectCustomer = (cust) => {
    setCustomer({
      name: cust.name,
      mobile: cust.mobile,
      email: cust.email || "",
    });
    setCustomerSuggestions([]);
  };


  const downloadBillAsPDF = () => {
  const customerName = generatedBill?.customer?.name || customer.name || "Customer";
  const billNumber = generatedBill?.saleNo || "bill";
  const fileName = `${billNumber}_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(7, 38, 133);
  doc.text("Denim Hub", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Your Denim Store", 14, 28);
  doc.text("123 Fashion Street, Pune - 411001", 14, 36);
  doc.text("GSTIN: 27ABCDE1234F1Z", 14, 44);
  
  // Bill Details
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Bill No: ${billNumber}`, 14, 58);
  doc.text(`Date: ${new Date(generatedBill?.billDate || Date.now()).toLocaleString()}`, 14, 66);
  doc.text(`Customer: ${customerName}`, 14, 74);
  doc.text(`Mobile: ${generatedBill?.customer?.mobile || customer.mobile || 'N/A'}`, 14, 82);
  doc.text(`Payment: ${generatedBill?.paymentMethod || paymentMethod}`, 14, 90);
  
  // Table
  const tableData = (generatedBill?.items || billItems).map((item, index) => [
    index + 1,
    item.product?.name || item.name,
    item.size || '-',
    `₹${item.price}`,
    item.quantity,
    `₹${item.total}`
  ]);
  
  autoTable(doc, {
    startY: 100,
    head: [['#', 'Product', 'Size', 'Price', 'Qty', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [7, 38, 133], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  // Summary
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Subtotal: ₹${generatedBill?.subtotal || subTotal.toFixed(2)}`, 140, finalY);
  doc.text(`Discount: ₹${generatedBill?.discountAmount || discountAmount.toFixed(2)}`, 140, finalY + 8);
  doc.setFontSize(14);
  doc.setTextColor(40, 167, 69);
  doc.text(`Grand Total: ₹${generatedBill?.totalAmount || finalAmount.toFixed(2)}`, 140, finalY + 20);
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for shopping with us!", 14, doc.internal.pageSize.height - 20);
  doc.text("** This is a computer generated invoice **", 14, doc.internal.pageSize.height - 12);
  
  doc.save(fileName);
  showToast(`✅ Bill saved as ${fileName}`, "success");
};
  const validateCoupon = async () => {
    if (!couponCode) {
      setCouponValid(null);
      setCouponDiscount(0);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8080/api/coupons/validate/${couponCode}`);
      if (response.data.valid) {
        setCouponValid(true);
        setCouponDiscount(response.data.discountPercent);
        showToast(`✅ Coupon applied! ${response.data.discountPercent}% discount`, "success");
      } else {
        setCouponValid(false);
        setCouponDiscount(0);
        showToast(`❌ ${response.data.message}`, "warning");
      }
    } catch (err) {
      setCouponValid(false);
      setCouponDiscount(0);
      showToast("❌ Invalid coupon code", "error");
    }
  };

  const addToBill = () => {
    const product = selectedProduct;
    if (!product) { showToast("❌ Select a product", "warning"); return; }
    if (!selectedSize) { showToast("❌ Select a size", "warning"); return; }
    if (quantity <= 0) { showToast("❌ Quantity must be at least 1", "warning"); return; }
    
    const sizeObj = product.sizes?.find(s => s.size === selectedSize);
    if (!sizeObj) { showToast("❌ Selected size not found", "error"); return; }
    if (quantity > sizeObj.stockQty) {
      showToast(`⚠️ Only ${sizeObj.stockQty} items available`, "warning");
      return;
    }

    let finalPrice = sizeObj.price;
    let productDiscount = 0;
    if (product.discountPercent && product.discountPercent > 0 && product.discountPercent <= 50) {
      productDiscount = product.discountPercent;
      finalPrice = sizeObj.price * (100 - product.discountPercent) / 100;
    }

    const existingItem = billItems.find(item => item.id === product.id && item.size === selectedSize);
    
    if (existingItem) {
      setBillItems(billItems.map(item => 
        item.id === product.id && item.size === selectedSize 
          ? { ...item, quantity: item.quantity + quantity, total: finalPrice * (item.quantity + quantity) }
          : item
      ));
    } else {
      setBillItems([...billItems, {
        id: product.id,
        name: product.name,
        size: selectedSize,
        originalPrice: sizeObj.price,
        price: finalPrice,
        discountPercent: productDiscount,
        quantity,
        total: finalPrice * quantity,
      }]);
    }

    setSelectedProductId("");
    setSelectedSize("");
    setQuantity(1);
    setSearchTerm("");
    showToast(`✅ Added ${product.name} (${selectedSize})`, "success");
  };

  const removeFromBill = (productId, size) => {
    setBillItems(billItems.filter(item => !(item.id === productId && item.size === size)));
    showToast("✅ Item removed", "success");
  };

  const updateQuantity = (productId, size, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromBill(productId, size);
      return;
    }
    const product = products.find(p => p.id === productId);
    const sizeObj = product?.sizes?.find(s => s.size === size);
    if (sizeObj && newQuantity > sizeObj.stockQty) {
      showToast(`Only ${sizeObj.stockQty} items available`, "warning");
      return;
    }
    setBillItems(billItems.map(item => 
      item.id === productId && item.size === size
        ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
        : item
    ));
  };

  const subTotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subTotal * discount) / 100;
  const couponDiscountAmount = (subTotal - discountAmount) * couponDiscount / 100;
  const finalAmount = subTotal - discountAmount - couponDiscountAmount;

  const generateBill = async () => {
    if (!customer.name.trim()) { showToast("❌ Enter customer name", "warning"); return; }
    if (!customer.mobile.match(/^[0-9]{10}$/)) { showToast("❌ Enter valid 10-digit mobile", "warning"); return; }
    if (billItems.length === 0) { showToast("❌ Add items to bill", "warning"); return; }

    try {
      const billData = {
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email || "",
        discountPercent: discount,
        paymentMethod: paymentMethod,
        couponCode: couponValid ? couponCode : null,
        subtotalBeforeDiscount: subTotal,
        items: billItems.map(item => ({
          productId: item.id,
          size: item.size,
          quantity: item.quantity
        })),
        sendSMS, sendEmail, sendWhatsApp
      };

      const response = await axios.post("http://localhost:8080/api/sales", billData);
      const saleData = response.data.sale || response.data;
      
      // Merge frontend discount info with backend response
      if (saleData.items && saleData.items.length > 0) {
        saleData.items = saleData.items.map((item, idx) => ({
          ...item,
          productDiscountPercent: billItems[idx]?.discountPercent || 0,
          originalPrice: billItems[idx]?.originalPrice || item.price
        }));
      }
      
      setGeneratedBill(saleData);
      setShowBill(true);
      showToast("✅ Bill generated successfully!", "success");
    } catch (err) {
      showToast(`❌ Failed: ${err.response?.data?.error || err.message}`, "error");
    }
  };

  const resetBill = () => {
    setBillItems([]);
    setDiscount(0);
    setCouponCode("");
    setCouponValid(null);
    setCouponDiscount(0);
    setShowBill(false);
    setGeneratedBill(null);
    setCustomer({ name: "", mobile: "", email: "" });
    setSendSMS(false); setSendEmail(false); setSendWhatsApp(false);
    fetchProducts();
  };

const printBill = () => {
  // Get customer name and bill number for the filename
  const customerName = generatedBill?.customer?.name || customer.name || "Customer";
  const billNumber = generatedBill?.saleNo || "bill";
  // Clean filename: remove special characters, replace spaces with underscore
  const fileName = `${billNumber}_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>${billNumber} - ${customerName}</title>
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
          <p><strong>Bill No:</strong> ${generatedBill?.saleNo || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(generatedBill?.billDate || Date.now()).toLocaleString()}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Mobile:</strong> ${generatedBill?.customer?.mobile || customer.mobile || 'N/A'}</p>
          <p><strong>Payment:</strong> ${generatedBill?.paymentMethod || paymentMethod}</p>
        </div>
        
        <table>
          <thead>
            <tr><th>#</th><th>Product</th><th>Size</th><th>Price</th><th>Qty</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${(generatedBill?.items || billItems).map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.product?.name || item.name}</td>
                <td>${item.size || '-'}</td>
                <td>₹${item.price}</td>
                <td>${item.quantity}</td>
                <td>₹${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <p><strong>Subtotal:</strong> ₹${generatedBill?.subtotal || subTotal.toFixed(2)}</p>
          <p><strong>Discount:</strong> ₹${generatedBill?.discountAmount || discountAmount.toFixed(2)}</p>
          <h3>Grand Total: ₹${generatedBill?.totalAmount || finalAmount.toFixed(2)}</h3>
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
  
  // Set the window title for the print dialog (doesn't affect filename)
  printWindow.document.title = `${billNumber} - ${customerName}`;
};

  return (
     <div className={`d-flex vh-100 overflow-hidden ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar />
     <div className={`flex-grow-1 p-4 overflow-auto ${darkMode ? 'dark-mode' : ''}`} style={{ background: darkMode ? "#1a1a2e" : "#F8F9FA", color: darkMode ? "#ffffff" : "#000000" }}>
        
        {/* Header with Dark Mode and Voice Search Buttons */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">🧾 Billing</h3>
          <div className="d-flex gap-2">
            {/* Voice Search Button */}
            <button 
              className={`btn ${isListening ? 'btn-danger' : 'btn-outline-primary'}`}
              onClick={startVoiceSearch}
              title="Voice Search Products"
            >
              {isListening ? <FaStop className="me-1" /> : <FaMicrophone className="me-1" />}
              {isListening ? 'Listening...' : 'Voice Search'}
            </button>
            
        
            
          </div>
        </div>

        {/* Customer Details */}
        <div className={`card mb-4 shadow-sm border-0 ${darkMode ? 'dark-mode-card' : ''}`}>
          <div className="card-body">
            <h5 className="mb-3"><FaUser className="me-2" />Customer Details</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label>Name *</label>
                <input className={`form-control ${darkMode ? 'dark-mode-input' : ''}`} value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              </div>
              <div className="col-md-4 position-relative">
                <label>Mobile *</label>
                <input className={`form-control ${darkMode ? 'dark-mode-input' : ''}`} value={customer.mobile}
                  onChange={(e) => handleMobileChange(e.target.value)} maxLength="10" />
                {customerSuggestions.length > 0 && (
                  <div className="list-group position-absolute w-100 shadow" style={{ zIndex: 1000, top: "70px" }}>
                    {customerSuggestions.map(c => (
                      <button key={c.id} type="button" className={`list-group-item list-group-item-action ${darkMode ? 'dark-mode-dropdown' : ''}`}
                        onClick={() => selectCustomer(c)}>
                        {c.name} - {c.mobile}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <label>Email (Optional)</label>
                <input className={`form-control ${darkMode ? 'dark-mode-input' : ''}`} value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className={`card mb-4 shadow-sm border-0 ${darkMode ? 'dark-mode-card' : ''}`}>
          <div className="card-body">
            <h5 className="mb-3"><FaShoppingCart className="me-2" />Add Products</h5>
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label>Search Product</label>
                <div className="input-group">
                  <input type="text" className={`form-control ${darkMode ? 'dark-mode-input' : ''}`} placeholder="Search by voice or type..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <button className={`btn btn-outline-secondary ${darkMode ? 'dark-mode-btn' : ''}`} onClick={startVoiceSearch}>
                    <FaMicrophone />
                  </button>
                </div>
                <select className={`form-select mt-2 ${darkMode ? 'dark-mode-select' : ''}`} value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)} size="3">
                  <option value="">Select Product</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - {p.category}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label>Size</label>
                <select className={`form-select ${darkMode ? 'dark-mode-select' : ''}`} value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)} disabled={!selectedProductId}>
                  <option value="">Select Size</option>
                  {selectedProduct?.sizes?.map(size => (
                    <option key={size.size} value={size.size}>
                      {size.size} (Stock: {size.stockQty}) - ₹{size.price}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label>Qty</label>
                <input type="number" className={`form-control ${darkMode ? 'dark-mode-input' : ''}`} value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))} min="1" />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100" onClick={addToBill}>
                  <FaPlus className="me-2" />Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Bill Table */}
        {billItems.length > 0 && !showBill && (
          <div className={`card shadow-sm border-0 mb-4 ${darkMode ? 'dark-mode-card' : ''}`}>
            <div className="card-body">
              <h5 className="mb-3">Current Bill</h5>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className={darkMode ? 'dark-mode-table-header' : 'table-light'}>
                    <tr>
                      <th>Product</th><th>Size</th><th>Original</th><th>Disc%</th><th>Price</th><th>Qty</th><th>Total</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td><span className="badge bg-info">{item.size}</span></td>
                        <td className="text-muted"><del>₹{item.originalPrice}</del></td>
                        <td className="text-danger">{item.discountPercent}%</td>
                        <td className="text-success">₹{item.price.toFixed(2)}</td>
                        <td><input type="number" className="form-control form-control-sm" style={{ width: "70px" }}
                          value={item.quantity} onChange={(e) => updateQuantity(item.id, item.size, Number(e.target.value))} /></td>
                        <td>₹{item.total.toFixed(2)}</td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => removeFromBill(item.id, item.size)}><FaTimes /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row mt-4">
                <div className="col-md-3">
                  <label><FaPercent /> Bill Discount (%)</label>
                  <input type="number" className={`form-control ${darkMode ? 'dark-mode-input' : ''}`} value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))} min="0" max="100" />
                </div>
                <div className="col-md-3">
                  <label><FaMoneyBillWave /> Payment</label>
                  <select className={`form-select ${darkMode ? 'dark-mode-select' : ''}`} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option>Cash</option><option>UPI</option><option>Card</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label><FaTicketAlt /> Coupon</label>
                  <div className="input-group">
                    <input type="text" className={`form-control ${darkMode ? 'dark-mode-input' : ''}`} placeholder="DH-CODE" value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                    <button className={`btn btn-outline-secondary ${darkMode ? 'dark-mode-btn' : ''}`} onClick={validateCoupon}>Apply</button>
                  </div>
                  {couponValid === true && <small className="text-success"><FaCheckCircle /> {couponDiscount}% off</small>}
                </div>
              </div>

              <div className="row mt-3">
                <div className="col-12">
                  <label className="fw-bold">Send Bill To Customer:</label>
                  <div className="d-flex gap-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="sendSMS" checked={sendSMS} onChange={(e) => setSendSMS(e.target.checked)} />
                      <label htmlFor="sendSMS"><FaSms className="text-primary" /> SMS</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="sendEmail" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
                      <label htmlFor="sendEmail"><FaEnvelope className="text-danger" /> Email</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="sendWhatsApp" checked={sendWhatsApp} onChange={(e) => setSendWhatsApp(e.target.checked)} />
                      <label htmlFor="sendWhatsApp"><FaWhatsapp className="text-success" /> WhatsApp</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-4 p-3 rounded ${darkMode ? 'dark-mode-bg-secondary' : 'bg-light'}`}>
                <div className="row">
                  <div className="col-md-6">
                    <p>Subtotal: ₹{subTotal.toFixed(2)}</p>
                    <p>Bill Discount ({discount}%): -₹{discountAmount.toFixed(2)}</p>
                    {couponDiscount > 0 && <p>Coupon Discount: -₹{couponDiscountAmount.toFixed(2)}</p>}
                    <h4>Total: ₹{finalAmount.toFixed(2)}</h4>
                  </div>
                  <div className="col-md-6 text-end">
                    <button className="btn btn-success btn-lg" onClick={generateBill}>Generate Bill</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Bill Preview */}
        {showBill && generatedBill && (
          <div className={`card shadow-sm ${darkMode ? 'dark-mode-card' : ''}`} id="bill-print" style={{ background: darkMode ? "#16213e" : "white" }}>
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2 style={{ color: darkMode ? "#4c6fd3" : "#072685" }}>🛒 Denim Hub</h2>
                <p>123 Fashion Street, Pune - 411001 | GSTIN: 27ABCDE1234F1Z</p>
                <h4>Tax Invoice</h4>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Bill To:</h6>
                  <p><strong>{generatedBill.customer?.name || customer.name}</strong><br/>
                  Mobile: {generatedBill.customer?.mobile || customer.mobile}<br/>
                  Email: {generatedBill.customer?.email || customer.email || "N/A"}</p>
                </div>
                <div className="col-md-6 text-end">
                  <h6>Bill Details:</h6>
                  <p>Bill No: {generatedBill.saleNo}<br/>
                  Date: {new Date(generatedBill.billDate).toLocaleString()}<br/>
                  Payment: {generatedBill.paymentMethod}</p>
                </div>
              </div>

              <table className="table table-bordered">
                <thead className="table-dark">
                  <tr><th>#</th><th>Product</th><th>Size</th><th>Original</th><th>Disc%</th><th>Final Price</th><th>Qty</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {(generatedBill.items || billItems).map((item, idx) => {
                    const discPercent = item.productDiscountPercent || item.discountPercent || 0;
                    const originalPrice = item.originalPrice || (item.price / (1 - discPercent / 100));
                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.product?.name || item.name}</td>
                        <td>{item.size}</td>
                        <td className="text-muted"><del>₹{originalPrice.toFixed(2)}</del></td>
                        <td className="text-danger fw-bold">{discPercent > 0 ? `${discPercent}%` : '-'}</td>
                        <td className="text-success fw-bold">₹{item.price.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td className="fw-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="row mt-3">
                <div className="col-md-6">
                  <p>Total Items: {generatedBill.totalItems || billItems.length}</p>
                  {couponValid && <p className="text-success"><FaGift /> Coupon: {couponCode} ({couponDiscount}% off)</p>}
                </div>
                <div className="col-md-6 text-end">
                  <p>Subtotal: ₹{(generatedBill.subtotal || subTotal).toFixed(2)}</p>
                  <p>Bill Discount: -₹{(generatedBill.discountAmount || discountAmount).toFixed(2)}</p>
                  {couponDiscount > 0 && <p>Coupon Discount: -₹{couponDiscountAmount.toFixed(2)}</p>}
                  <hr />
                  <h3 className="text-success">Grand Total: ₹{(generatedBill.totalAmount || finalAmount).toFixed(2)}</h3>
                </div>
              </div>

              <div className="text-center mt-4">
                <p>Thank you for shopping with us!</p>
               <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-primary" onClick={printBill}>
                    <FaPrint className="me-2" />Print Bill
                  </button>
                  <button className="btn btn-info" onClick={downloadBillAsPDF}>
                    <FaDownload className="me-2" />Download PDF
                  </button>
                  <button className="btn btn-success" onClick={resetBill}>
                    New Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
      </div>
    </div>
  );
}

export default Billing;