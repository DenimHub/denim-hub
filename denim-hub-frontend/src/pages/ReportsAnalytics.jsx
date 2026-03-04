import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaChartBar,
  FaRupeeSign,
  FaFire,
  FaSnowflake,
  FaBoxes,
  FaSync,
  FaCalendarAlt,
  FaDownload
} from "react-icons/fa";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import axios from "axios";

function ReportsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [summary, setSummary] = useState({
    monthlySales: 0,
    totalProfit: 0,
    topProduct: { name: "N/A", sold: 0 },
    stockValuation: 0,
    totalRevenue: 0,
    totalBills: 0,
    totalItems: 0
  });
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });

  // Colors for charts
  const COLORS = ['#13338f', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];

  // Fetch all data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Build URL with date filters
      let billsUrl = "http://localhost:8080/api/bills";
      const params = new URLSearchParams();
      if (dateRange.from) params.append("fromDate", dateRange.from);
      if (dateRange.to) params.append("toDate", dateRange.to);
      if (params.toString()) {
        billsUrl += "?" + params.toString();
      }
      
      // Fetch bills
      const billsResponse = await axios.get(billsUrl);
      const bills = Array.isArray(billsResponse.data) ? billsResponse.data : [];
      
      // Fetch products for stock data
      const productsResponse = await axios.get("http://localhost:8080/api/products");
      const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      
      // Calculate analytics
      calculateAnalytics(bills, products);
      
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      alert("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate all analytics
  const calculateAnalytics = (bills, products) => {
    // 1. Sales Data for chart (Daily/Weekly/Monthly)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // Calculate daily sales (last 7 days)
    const dailySales = bills
      .filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= weekAgo;
      })
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    // Calculate weekly sales (last 30 days)
    const weeklySales = bills
      .filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= monthAgo;
      })
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    // Calculate monthly sales (all bills in selected range)
    const monthlySales = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    setSalesData([
      { period: "Daily", sales: dailySales },
      { period: "Weekly", sales: weeklySales },
      { period: "Monthly", sales: monthlySales }
    ]);

    // 2. Product Performance
    const productMap = new Map();
    
    // Initialize with all products
    products.forEach(product => {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        sold: 0,
        stock: product.stockQty || 0,
        cost: product.price * 0.6, // Assuming 60% of price is cost (you can adjust)
        price: product.price,
        revenue: 0,
        profit: 0
      });
    });
    
    // Calculate sales from bills
    bills.forEach(bill => {
      if (bill.items && Array.isArray(bill.items)) {
        bill.items.forEach(item => {
          const productId = item.product?.id;
          if (productId && productMap.has(productId)) {
            const product = productMap.get(productId);
            product.sold += item.quantity || 0;
            product.revenue += item.total || 0;
            product.profit += (item.total || 0) - ((item.price * 0.6) * (item.quantity || 0));
            productMap.set(productId, product);
          }
        });
      }
    });
    
    const productPerf = Array.from(productMap.values());
    setProductPerformance(productPerf);

    // 3. Calculate Summary
    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const totalBills = bills.length;
    const totalItems = bills.reduce((sum, bill) => sum + (bill.totalItems || 0), 0);
    
    // Calculate profit (revenue - cost)
    const totalCost = productPerf.reduce((sum, p) => sum + (p.cost * p.sold), 0);
    const totalProfit = totalRevenue - totalCost;
    
    // Find top selling product
    const topProduct = productPerf.length > 0 
      ? productPerf.reduce((max, p) => p.sold > max.sold ? p : max, productPerf[0])
      : { name: "N/A", sold: 0 };
    
    // Calculate stock valuation
    const stockValuation = productPerf.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    
    setSummary({
      monthlySales: totalRevenue,
      totalProfit: Math.max(0, totalProfit),
      topProduct: { name: topProduct.name, sold: topProduct.sold },
      stockValuation,
      totalRevenue,
      totalBills,
      totalItems
    });
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange.from, dateRange.to]);

  // Get top selling products
  const topSelling = [...productPerformance]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Get slow moving products (lowest sales, but with stock)
  const slowMoving = [...productPerformance]
    .filter(p => p.stock > 0)
    .sort((a, b) => a.sold - b.sold)
    .slice(0, 5);

  // Data for pie chart - Payment method breakdown
  const [paymentData, setPaymentData] = useState([]);

  // Fetch payment breakdown separately
  const fetchPaymentBreakdown = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append("fromDate", dateRange.from);
      if (dateRange.to) params.append("toDate", dateRange.to);
      
      const response = await axios.get("http://localhost:8080/api/bills/payment-breakdown", { params });
      
      if (response.data && response.data.amounts) {
        const data = Object.entries(response.data.amounts).map(([name, value]) => ({
          name,
          value
        }));
        setPaymentData(data);
      }
    } catch (err) {
      console.error("Error fetching payment breakdown:", err);
    }
  };

  useEffect(() => {
    fetchPaymentBreakdown();
  }, [dateRange.from, dateRange.to]);

  // Export report as CSV
  const exportReport = () => {
    try {
      let csvContent = "Report,Value\n";
      csvContent += `Monthly Sales,${summary.monthlySales}\n`;
      csvContent += `Total Profit,${summary.totalProfit}\n`;
      csvContent += `Total Revenue,${summary.totalRevenue}\n`;
      csvContent += `Total Bills,${summary.totalBills}\n`;
      csvContent += `Total Items Sold,${summary.totalItems}\n`;
      csvContent += `Stock Valuation,${summary.stockValuation}\n`;
      csvContent += `Top Product,${summary.topProduct.name}\n`;
      csvContent += `Top Product Sales,${summary.topProduct.sold}\n\n`;
      
      csvContent += "Product Name,Sold Units,Current Stock,Revenue,Estimated Profit\n";
      productPerformance.forEach(p => {
        csvContent += `${p.name},${p.sold},${p.stock},${p.revenue || 0},${p.profit || 0}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error("Error exporting report:", err);
      alert("Failed to export report");
    }
  };

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Reports & Analytics</h3>
          
          <div className="d-flex gap-2">
            {/* Export Button */}
            <button 
              className="btn btn-success"
              onClick={exportReport}
              disabled={loading}
            >
              <FaDownload className="me-2" />
              Export Report
            </button>
            
            {/* Refresh Button */}
            <button 
              className="btn btn-outline-primary"
              onClick={fetchAnalyticsData}
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
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
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
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              />
            </div>

            <div className="col-md-4">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => setDateRange({ from: "", to: "" })}
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-0 bg-primary bg-opacity-10">
                  <FaChartBar size={26} className="text-primary mb-2" />
                  <h6 className="text-muted">Monthly Sales</h6>
                  <h4 className="mb-0">₹ {summary.monthlySales.toFixed(2)}</h4>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-0 bg-success bg-opacity-10">
                  <FaRupeeSign size={26} className="text-success mb-2" />
                  <h6 className="text-muted">Total Profit</h6>
                  <h4 className="mb-0">₹ {summary.totalProfit.toFixed(2)}</h4>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-0 bg-danger bg-opacity-10">
                  <FaFire size={26} className="text-danger mb-2" />
                  <h6 className="text-muted">Top Product</h6>
                  <h6 className="mb-0 text-truncate">{summary.topProduct.name}</h6>
                  <small>{summary.topProduct.sold} units sold</small>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-0 bg-warning bg-opacity-10">
                  <FaBoxes size={26} className="text-warning mb-2" />
                  <h6 className="text-muted">Stock Valuation</h6>
                  <h4 className="mb-0">₹ {summary.stockValuation.toFixed(2)}</h4>
                </div>
              </div>
            </div>

            {/* Additional Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card p-3 shadow-sm border-0 bg-info bg-opacity-10">
                  <h6 className="text-muted">Total Revenue</h6>
                  <h5>₹ {summary.totalRevenue.toFixed(2)}</h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 shadow-sm border-0 bg-secondary bg-opacity-10">
                  <h6 className="text-muted">Total Bills</h6>
                  <h5>{summary.totalBills}</h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 shadow-sm border-0 bg-dark bg-opacity-10">
                  <h6 className="text-muted">Items Sold</h6>
                  <h5>{summary.totalItems}</h5>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="row g-3 mb-4">
              {/* Sales Bar Chart */}
              <div className="col-md-8">
                <div className="card p-4 shadow-sm">
                  <h5 className="mb-3">Sales Overview</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                      <Bar dataKey="sales" fill="#13338f" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Methods Pie Chart */}
              <div className="col-md-4">
                <div className="card p-4 shadow-sm">
                  <h5 className="mb-3">Payment Methods</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* TOP SELLING PRODUCTS */}
            <div className="card p-4 shadow-sm mb-4">
              <h5 className="mb-3">
                <FaFire className="text-danger me-2" />
                Top Selling Products
              </h5>

              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                      <th>Current Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSelling.length > 0 ? (
                      topSelling.map((p, index) => (
                        <tr key={p.id || index}>
                          <td>{index + 1}</td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.sold}</td>
                          <td>₹{(p.revenue || 0).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${p.stock > 10 ? 'bg-success' : p.stock > 0 ? 'bg-warning' : 'bg-danger'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td>
                            {p.stock > 10 ? 'In Stock' : p.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-3">
                          No sales data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SLOW MOVING PRODUCTS */}
            <div className="card p-4 shadow-sm mb-4">
              <h5 className="mb-3">
                <FaSnowflake className="text-info me-2" />
                Slow Moving Products
              </h5>

              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th>Current Stock</th>
                      <th>Stock Value</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowMoving.length > 0 ? (
                      slowMoving.map((p, index) => (
                        <tr key={p.id || index}>
                          <td>{index + 1}</td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.sold}</td>
                          <td>
                            <span className="badge bg-warning">{p.stock}</span>
                          </td>
                          <td>₹{(p.stock * p.cost).toFixed(2)}</td>
                          <td>
                            {p.sold === 0 ? (
                              <span className="badge bg-danger">Consider Discount</span>
                            ) : p.stock > p.sold * 3 ? (
                              <span className="badge bg-warning">High Inventory</span>
                            ) : (
                              <span className="badge bg-success">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-3">
                          No slow moving products
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportsAnalytics;