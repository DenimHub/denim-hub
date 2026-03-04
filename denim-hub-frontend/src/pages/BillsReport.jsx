import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import {
  FaFileInvoice,
  FaRupeeSign,
  FaEye,
  FaPrint,
  FaCalendarAlt,
  FaDownload,
  FaFilePdf,
  FaFileCsv,
  FaSync,
  FaChartPie,
  FaUser
} from "react-icons/fa";

function BillsReport() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0,
    totalDiscount: 0,
    totalItems: 0,
    averageBillValue: 0
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const exportMenuRef = useRef(null);

  // Fetch bills
  const fetchBills = async () => {
    try {
      setLoading(true);
      let url = "http://localhost:8080/api/bills";
      
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      console.log("Fetching bills from:", url);
      const response = await axios.get(url);
      console.log("Bills received:", response.data);
      
      setBills(Array.isArray(response.data) ? response.data : []);
      
      // Fetch summary
      const summaryResponse = await axios.get("http://localhost:8080/api/bills/summary", { params });
      console.log("Summary received:", summaryResponse.data);
      setSummary(summaryResponse.data || {
        totalBills: 0,
        totalAmount: 0,
        totalDiscount: 0,
        totalItems: 0,
        averageBillValue: 0
      });
      
    } catch (err) {
      console.error("Error fetching bills:", err);
      alert("Failed to load bills. Make sure backend is running.");
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fromDate, toDate]);

  // View bill details
  const viewBill = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/bills/${id}`);
      setSelectedBill(response.data);
      setShowBillModal(true);
    } catch (err) {
      console.error("Error fetching bill details:", err);
      alert("Failed to load bill details");
    }
  };

  // Print bill
  const printBill = (bill) => {
    const printWindow = window.open('', '_blank');
    
    // Get customer details safely
    const customerName = bill.customer?.name || 'Walk-in Customer';
    const customerMobile = bill.customer?.mobile || 'N/A';
    const customerEmail = bill.customer?.email || 'N/A';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill ${bill.saleNo}</title>
          <style>
            body { font-family: Arial; padding: 30px; margin: 0; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { color: #333; margin: 0; font-size: 32px; }
            .header p { color: #666; margin: 5px 0 0; }
            .shop-details { text-align: center; margin-bottom: 20px; }
            .bill-title { text-align: center; margin: 20px 0; }
            .bill-title h3 { background: #f0f0f0; padding: 10px; display: inline-block; }
            .customer-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #007bff; }
            .customer-details p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #007bff; color: white; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 10px; }
            .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; text-align: right; }
            .summary p { margin: 5px 0; }
            .summary h3 { color: #28a745; margin: 10px 0 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
            .print-hide { display: none; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Denim Hub</h1>
            <p>Your Denim Store</p>
          </div>
          
          <div class="bill-title">
            <h3>Tax Invoice</h3>
          </div>
          
          <div class="customer-details">
            <p><strong>Bill No:</strong> ${bill.saleNo}</p>
            <p><strong>Date:</strong> ${new Date(bill.billDate).toLocaleString()}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Mobile:</strong> ${customerMobile}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Payment:</strong> ${bill.paymentMethod}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items?.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product?.name || 'N/A'}</td>
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

  // Export to PDF
  const exportToPDF = () => {
    try {
      if (!bills.length) {
        alert("No bills to export");
        return;
      }

      // Create a new window for PDF content
      const printWindow = window.open('', '_blank');
      
      let tableRows = '';
      bills.forEach((bill, index) => {
        const customerName = bill.customer?.name || 'Walk-in Customer';
        tableRows += `
          <tr>
            <td>${index + 1}</td>
            <td>${bill.saleNo}</td>
            <td>${new Date(bill.billDate).toLocaleDateString()}</td>
            <td>${customerName}</td>
            <td>${bill.totalItems}</td>
            <td>₹${bill.subtotal}</td>
            <td>₹${bill.discountAmount || 0}</td>
            <td>₹${bill.totalAmount}</td>
            <td>${bill.paymentMethod}</td>
          </tr>
        `;
      });

      printWindow.document.write(`
        <html>
          <head>
            <title>Bills Report</title>
            <style>
              body { font-family: Arial; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .summary { margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; }
              th { background: #007bff; color: white; padding: 10px; }
              td { border: 1px solid #ddd; padding: 8px; }
              .footer { text-align: center; margin-top: 30px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Denim Hub</h1>
              <h3>Bills Report</h3>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="summary">
              <p><strong>Total Bills:</strong> ${summary.totalBills}</p>
              <p><strong>Total Amount:</strong> ₹${summary.totalAmount}</p>
              <p><strong>Total Discount:</strong> ₹${summary.totalDiscount}</p>
              <p><strong>Average Bill Value:</strong> ₹${summary.averageBillValue}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Denim Hub Inventory System</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      
    } catch (err) {
      console.error("Error exporting to PDF:", err);
      alert("Failed to export PDF");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      if (!bills.length) {
        alert("No bills to export");
        return;
      }
      
      // Create CSV content with customer details
      let csvContent = "Bill No,Date,Customer Name,Customer Mobile,Customer Email,Items,Subtotal,Discount,Total,Payment Method\n";
      
      bills.forEach(bill => {
        const customerName = bill.customer?.name || 'Walk-in Customer';
        const customerMobile = bill.customer?.mobile || '';
        const customerEmail = bill.customer?.email || '';
        
        csvContent += `"${bill.saleNo}","${new Date(bill.billDate).toLocaleDateString()}","${customerName}","${customerMobile}","${customerEmail}",${bill.totalItems},${bill.subtotal},${bill.discountAmount || 0},${bill.totalAmount},${bill.paymentMethod}\n`;
      });
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `bills-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error("Error exporting to CSV:", err);
      alert("Failed to export CSV");
    }
  };

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Bills Report</h3>
          
          <div className="d-flex gap-2">
            {/* Export Button */}
            <div className="position-relative" ref={exportMenuRef}>
              <button 
                className="btn btn-success"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <FaDownload className="me-2" />
                Export
              </button>
              
              {showExportMenu && (
                <div className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border" style={{ minWidth: "180px", zIndex: 1000 }}>
                  <button 
                    className="btn w-100 text-start px-3 py-2 border-0 bg-transparent hover-bg-light"
                    onClick={exportToPDF}
                  >
                    <FaFilePdf className="text-danger me-2" />
                    Export as PDF
                  </button>
                  <button 
                    className="btn w-100 text-start px-3 py-2 border-0 bg-transparent hover-bg-light"
                    onClick={exportToCSV}
                  >
                    <FaFileCsv className="text-success me-2" />
                    Export as CSV
                  </button>
                </div>
              )}
            </div>
            
            {/* Refresh Button */}
            <button 
              className="btn btn-outline-primary"
              onClick={fetchBills}
              disabled={loading}
            >
              <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="card p-3 mb-4 shadow-sm">
          <div className="row align-items-end">
            <div className="col-md-4">
              <label className="form-label">
                <FaCalendarAlt className="me-2" />
                From Date
              </label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <FaCalendarAlt className="me-2" />
                To Date
              </label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-primary bg-opacity-10">
              <FaFileInvoice size={28} className="mb-2 text-primary" />
              <h6 className="text-muted">Total Bills</h6>
              <h4 className="mb-0">{summary.totalBills}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-success bg-opacity-10">
              <FaRupeeSign size={28} className="mb-2 text-success" />
              <h6 className="text-muted">Total Amount</h6>
              <h4 className="mb-0">₹ {summary.totalAmount}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-info bg-opacity-10">
              <FaRupeeSign size={28} className="mb-2 text-info" />
              <h6 className="text-muted">Total Discount</h6>
              <h4 className="mb-0">₹ {summary.totalDiscount}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-warning bg-opacity-10">
              <FaChartPie size={28} className="mb-2 text-warning" />
              <h6 className="text-muted">Avg Bill Value</h6>
              <h4 className="mb-0">₹ {summary.averageBillValue}</h4>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Bill Details</h5>
            <div className="text-muted small">
              Total Items: {summary.totalItems} | Bills: {bills.length}
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
                      <th style={{ width: "50px" }}>#</th>
                      <th>Bill No</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Subtotal</th>
                      <th>Discount</th>
                      <th>Total (₹)</th>
                      <th>Payment</th>
                      <th style={{ width: "120px" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bills.length > 0 ? (
                      bills.map((bill, index) => {
                        const customerName = bill.customer?.name || 'Walk-in Customer';
                        const customerMobile = bill.customer?.mobile || '';
                        
                        return (
                          <tr key={bill.id}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{bill.saleNo}</strong>
                            </td>
                            <td>{new Date(bill.billDate).toLocaleDateString()}</td>
                            <td>
                              <div>
                                <span className="fw-bold">{customerName}</span>
                                {customerMobile && (
                                  <small className="d-block text-muted">{customerMobile}</small>
                                )}
                              </div>
                            </td>
                            <td className="text-center">{bill.totalItems}</td>
                            <td>₹{bill.subtotal}</td>
                            <td>₹{bill.discountAmount || 0}</td>
                            <td className="fw-bold">₹{bill.totalAmount}</td>
                            <td>
                              <span className={`badge ${
                                bill.paymentMethod === 'Cash' ? 'bg-success' :
                                bill.paymentMethod === 'UPI' ? 'bg-info' : 'bg-warning'
                              }`}>
                                {bill.paymentMethod}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => viewBill(bill.id)}
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => printBill(bill)}
                                title="Print"
                              >
                                <FaPrint />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          No bills found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Bill Details Modal */}
        {showBillModal && selectedBill && (
          <>
            <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Bill Details - {selectedBill.saleNo}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowBillModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <h6><FaUser className="me-2" />Customer Information</h6>
                        <p className="mb-1"><strong>Name:</strong> {selectedBill.customer?.name || 'Walk-in Customer'}</p>
                        <p className="mb-1"><strong>Mobile:</strong> {selectedBill.customer?.mobile || 'N/A'}</p>
                        <p className="mb-1"><strong>Email:</strong> {selectedBill.customer?.email || 'N/A'}</p>
                      </div>
                      <div className="col-md-6 text-end">
                        <h6>Bill Information</h6>
                        <p className="mb-1"><strong>Date:</strong> {new Date(selectedBill.billDate).toLocaleString()}</p>
                        <p className="mb-1"><strong>Payment:</strong> {selectedBill.paymentMethod}</p>
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
                        {selectedBill.items?.map((item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{item.product?.name || 'N/A'}</td>
                            <td>₹{item.price}</td>
                            <td>{item.quantity}</td>
                            <td>₹{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="row">
                      <div className="col-md-6">
                        <p>Total Items: {selectedBill.totalItems}</p>
                      </div>
                      <div className="col-md-6 text-end">
                        <p>Subtotal: ₹{selectedBill.subtotal}</p>
                        <p>Discount: ₹{selectedBill.discountAmount || 0}</p>
                        <h4>Grand Total: ₹{selectedBill.totalAmount}</h4>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => printBill(selectedBill)}
                    >
                      <FaPrint className="me-2" />
                      Print
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setShowBillModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
}

export default BillsReport;