import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { 
  FaRupeeSign, 
  FaShoppingCart, 
  FaCalendarAlt,
  FaSync,
  FaFileExport,
  FaChartLine,
  FaWallet,
  FaDownload
} from "react-icons/fa";
import axios from "axios";

function SalesReport() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalBills: 0,
    totalItems: 0,
    averageBillValue: 0,
    cashTotal: 0,
    upiTotal: 0,
    cardTotal: 0
  });

  // Fetch sales data
  const fetchSales = async () => {
    try {
      setLoading(true);
      
      // Build URL with date filters
      let url = "http://localhost:8080/api/bills";
      const params = new URLSearchParams();
      
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      console.log("Fetching sales from:", url);
      const response = await axios.get(url);
      console.log("Sales received:", response.data);
      
      const salesData = Array.isArray(response.data) ? response.data : [];
      setSales(salesData);
      
      // Calculate summary
      calculateSummary(salesData);
      
    } catch (err) {
      console.error("Error fetching sales:", err);
      alert("Failed to load sales data. Make sure backend is running.");
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateSummary = (salesData) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const totalBills = salesData.length;
    const totalItems = salesData.reduce((sum, sale) => sum + (sale.totalItems || 0), 0);
    const averageBillValue = totalBills > 0 ? (totalRevenue / totalBills).toFixed(2) : 0;
    
    // Payment method totals
    const cashTotal = salesData
      .filter(sale => sale.paymentMethod === 'Cash')
      .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      
    const upiTotal = salesData
      .filter(sale => sale.paymentMethod === 'UPI')
      .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      
    const cardTotal = salesData
      .filter(sale => sale.paymentMethod === 'Card')
      .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    
    setSummary({
      totalRevenue,
      totalBills,
      totalItems,
      averageBillValue,
      cashTotal,
      upiTotal,
      cardTotal
    });
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSales();
  }, [fromDate, toDate]);

  // Export to CSV
  const exportToCSV = () => {
    try {
      if (!sales.length) {
        alert("No data to export");
        return;
      }

      // Create CSV content
      let csvContent = "Bill No,Date,Customer,Mobile,Items,Subtotal,Discount,Total,Payment Method\n";
      
      sales.forEach(sale => {
        const customerName = sale.customer?.name || 'Walk-in Customer';
        const customerMobile = sale.customer?.mobile || '';
        
        csvContent += `"${sale.saleNo}","${new Date(sale.billDate).toLocaleDateString()}","${customerName}","${customerMobile}",${sale.totalItems},${sale.subtotal},${sale.discountAmount || 0},${sale.totalAmount},${sale.paymentMethod}\n`;
      });
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `sales-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error("Error exporting to CSV:", err);
      alert("Failed to export CSV");
    }
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Sales Report</h3>
          
          <div className="d-flex gap-2">
            {/* Export Button */}
            <button 
              className="btn btn-success"
              onClick={exportToCSV}
              disabled={loading || sales.length === 0}
            >
              <FaDownload className="me-2" />
              Export CSV
            </button>
            
            {/* Refresh Button */}
            <button 
              className="btn btn-outline-primary"
              onClick={fetchSales}
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
            <div className="card p-3 shadow-sm border-0 bg-success bg-opacity-10">
              <FaRupeeSign size={28} className="mb-2 text-success" />
              <h6 className="text-muted">Total Revenue</h6>
              <h4 className="mb-0">₹ {summary.totalRevenue.toFixed(2)}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-primary bg-opacity-10">
              <FaShoppingCart size={28} className="mb-2 text-primary" />
              <h6 className="text-muted">Total Bills</h6>
              <h4 className="mb-0">{summary.totalBills}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-info bg-opacity-10">
              <FaChartLine size={28} className="mb-2 text-info" />
              <h6 className="text-muted">Total Items Sold</h6>
              <h4 className="mb-0">{summary.totalItems}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-warning bg-opacity-10">
              <FaWallet size={28} className="mb-2 text-warning" />
              <h6 className="text-muted">Avg Bill Value</h6>
              <h4 className="mb-0">₹ {summary.averageBillValue}</h4>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        {sales.length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card p-3 shadow-sm border-0 bg-success bg-opacity-10">
                <h6 className="text-muted">Cash Payments</h6>
                <h5 className="mb-0">₹ {summary.cashTotal.toFixed(2)}</h5>
                <small className="text-muted">
                  {((summary.cashTotal / summary.totalRevenue) * 100).toFixed(1)}% of total
                </small>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card p-3 shadow-sm border-0 bg-info bg-opacity-10">
                <h6 className="text-muted">UPI Payments</h6>
                <h5 className="mb-0">₹ {summary.upiTotal.toFixed(2)}</h5>
                <small className="text-muted">
                  {((summary.upiTotal / summary.totalRevenue) * 100).toFixed(1)}% of total
                </small>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card p-3 shadow-sm border-0 bg-warning bg-opacity-10">
                <h6 className="text-muted">Card Payments</h6>
                <h5 className="mb-0">₹ {summary.cardTotal.toFixed(2)}</h5>
                <small className="text-muted">
                  {((summary.cardTotal / summary.totalRevenue) * 100).toFixed(1)}% of total
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Sales Table */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Sales Details</h5>
            <div className="text-muted small">
              {sales.length} record{sales.length !== 1 ? 's' : ''} found
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
                      <th>Mobile</th>
                      <th>Items</th>
                      <th>Subtotal</th>
                      <th>Discount</th>
                      <th>Total (₹)</th>
                      <th>Payment Mode</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sales.length > 0 ? (
                      sales.map((sale, index) => {
                        const customerName = sale.customer?.name || 'Walk-in Customer';
                        const customerMobile = sale.customer?.mobile || '-';
                        
                        return (
                          <tr key={sale.id}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{sale.saleNo}</strong>
                            </td>
                            <td>{formatDate(sale.billDate)}</td>
                            <td>{customerName}</td>
                            <td>{customerMobile}</td>
                            <td className="text-center">{sale.totalItems}</td>
                            <td>₹{sale.subtotal}</td>
                            <td>₹{sale.discountAmount || 0}</td>
                            <td className="fw-bold">₹{sale.totalAmount}</td>
                            <td>
                              <span className={`badge ${
                                sale.paymentMethod === 'Cash' ? 'bg-success' :
                                sale.paymentMethod === 'UPI' ? 'bg-info' : 'bg-warning'
                              }`}>
                                {sale.paymentMethod}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          {fromDate || toDate 
                            ? "No sales data found for selected date range" 
                            : "No sales data available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesReport;