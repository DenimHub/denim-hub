import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useToast } from "../context/ToastContext";
import { useDarkMode } from "../context/DarkModeContext";
import {
  FaChartBar,
  FaRupeeSign,
  FaFire,
  FaSnowflake,
  FaBoxes,
  FaSync,
  FaCalendarAlt,
  FaDownload,
  FaChartLine,
  FaTachometerAlt,
  FaHeartbeat,
  FaBrain,
  FaRobot
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
    const { darkMode } = useDarkMode();
  const { showToast } = useToast();
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

  const COLORS = ['#13338f', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14'];

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      let billsUrl = "http://localhost:8080/api/bills";
      const params = new URLSearchParams();
      if (dateRange.from) params.append("fromDate", dateRange.from);
      if (dateRange.to) params.append("toDate", dateRange.to);
      if (params.toString()) {
        billsUrl += "?" + params.toString();
      }
      
      const billsResponse = await axios.get(billsUrl);
      const bills = Array.isArray(billsResponse.data) ? billsResponse.data : [];
      
      const productsResponse = await axios.get("http://localhost:8080/api/products");
      const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      
      calculateAnalytics(bills, products);
      
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      showToast("❌ Failed to load analytics data", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (bills, products) => {
    const getTotalStock = (product) => {
      return product.sizes?.reduce((sum, s) => sum + (s.stockQty || 0), 0) || 0;
    };
    
    const getMinPrice = (product) => {
      return product.sizes?.length > 0 ? Math.min(...product.sizes.map(s => s.price)) : product.price || 0;
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const dailySales = bills
      .filter(bill => new Date(bill.billDate) >= weekAgo)
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    const weeklySales = bills
      .filter(bill => new Date(bill.billDate) >= monthAgo)
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    const monthlySales = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    setSalesData([
      { period: "Daily", sales: dailySales },
      { period: "Weekly", sales: weeklySales },
      { period: "Monthly", sales: monthlySales }
    ]);

    const productMap = new Map();
    
    products.forEach(product => {
      const totalStock = getTotalStock(product);
      const minPrice = getMinPrice(product);
      
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        category: product.category,
        sold: 0,
        stock: totalStock,
        minStock: product.minStock || 10,
        cost: minPrice * 0.6,
        price: minPrice,
        revenue: 0,
        profit: 0,
        discountPercent: product.discountPercent || 0
      });
    });
    
    bills.forEach(bill => {
      if (bill.items && Array.isArray(bill.items)) {
        bill.items.forEach(item => {
          const productId = item.product?.id;
          if (productId && productMap.has(productId)) {
            const product = productMap.get(productId);
            const quantity = item.quantity || 0;
            product.sold += quantity;
            product.revenue += item.total || 0;
            product.profit += (item.total || 0) - ((item.price || 0) * 0.6 * quantity);
            productMap.set(productId, product);
          }
        });
      }
    });
    
    const productPerf = Array.from(productMap.values());
    setProductPerformance(productPerf);

    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const totalBills = bills.length;
    const totalItems = bills.reduce((sum, bill) => sum + (bill.totalItems || 0), 0);
    const totalCost = productPerf.reduce((sum, p) => sum + (p.cost * p.sold), 0);
    const totalProfit = totalRevenue - totalCost;
    const topProduct = productPerf.length > 0 
      ? productPerf.reduce((max, p) => p.sold > max.sold ? p : max, productPerf[0])
      : { name: "N/A", sold: 0 };
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

  const topSelling = [...productPerformance]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const slowMoving = [...productPerformance]
    .filter(p => p.stock > 0)
    .map(p => ({
      ...p,
      stockToSalesRatio: p.sold > 0 ? p.stock / p.sold : p.stock
    }))
    .sort((a, b) => b.stockToSalesRatio - a.stockToSalesRatio)
    .slice(0, 5);

  const getProductLifecycle = (product) => {
    const stock = product.stock;
    const sold = product.sold;
    const minStock = product.minStock || 10;
    
    if (sold === 0 && stock > 0) return { stage: "New Arrival", color: "#17a2b8", icon: "🆕", urgency: "Low" };
    if (stock === 0) return { stage: "Out of Stock", color: "#dc3545", icon: "❌", urgency: "High" };
    if (stock <= minStock && sold > 0) return { stage: "Low Stock - Popular", color: "#ffc107", icon: "⚠️", urgency: "High" };
    if (stock > sold * 3) return { stage: "Overstocked", color: "#fd7e14", icon: "📦", urgency: "Medium" };
    if (sold > stock * 2) return { stage: "Best Seller", color: "#28a745", icon: "🔥", urgency: "Low" };
    if (sold < 5 && stock > 20) return { stage: "Slow Mover", color: "#6c757d", icon: "🐌", urgency: "Medium" };
    return { stage: "Stable", color: "#13338f", icon: "✓", urgency: "Low" };
  };

  const lifecycleData = productPerformance.map(p => ({
    name: p.name,
    category: p.category,
    stock: p.stock,
    sold: p.sold,
    ...getProductLifecycle(p)
  }));

  const inventoryTurnover = productPerformance.map(p => ({
    name: p.name,
    turnoverRate: p.sold > 0 ? (p.sold / (p.stock + p.sold) * 100).toFixed(1) : 0,
    daysToSell: p.sold > 0 ? Math.round((p.stock / p.sold) * 30) : 999
  })).sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 5);

  const [paymentData, setPaymentData] = useState([]);

  const fetchPaymentBreakdown = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append("fromDate", dateRange.from);
      if (dateRange.to) params.append("toDate", dateRange.to);
      const response = await axios.get("http://localhost:8080/api/bills/payment-breakdown", { params });
      if (response.data && response.data.amounts) {
        const data = Object.entries(response.data.amounts).map(([name, value]) => ({ name, value }));
        setPaymentData(data);
      }
    } catch (err) {
      console.error("Error fetching payment breakdown:", err);
    }
  };

  useEffect(() => {
    fetchPaymentBreakdown();
  }, [dateRange.from, dateRange.to]);

  const exportReport = () => {
    try {
      let csvContent = "=== DENIM HUB ANALYTICS REPORT ===\n\n";
      csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
      csvContent += `Date Range: ${dateRange.from || "All"} to ${dateRange.to || "All"}\n\n`;
      
      csvContent += "KEY METRICS\n";
      csvContent += `Total Revenue,${summary.totalRevenue}\n`;
      csvContent += `Total Profit,${summary.totalProfit}\n`;
      csvContent += `Total Bills,${summary.totalBills}\n`;
      csvContent += `Total Items Sold,${summary.totalItems}\n`;
      csvContent += `Stock Valuation,${summary.stockValuation}\n`;
      csvContent += `Top Product,${summary.topProduct.name}\n\n`;
      
      csvContent += "PRODUCT LIFECYCLE ANALYSIS\n";
      csvContent += "Product Name,Category,Stock,Sold,Lifecycle Stage,Urgency\n";
      lifecycleData.forEach(p => {
        csvContent += `${p.name},${p.category},${p.stock},${p.sold},${p.stage},${p.urgency}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("✅ Report exported successfully!", "success");
    } catch (err) {
      console.error("Error exporting report:", err);
      showToast("❌ Failed to export report", "error");
    }
  };

  const getStockStatusBadge = (stock, minStock) => {
    if (stock <= 0) return <span className="badge bg-dark">Out of Stock</span>;
    if (stock <= minStock) return <span className="badge bg-danger">Low Stock</span>;
    if (stock <= minStock * 2) return <span className="badge bg-warning text-dark">Medium Stock</span>;
    return <span className="badge bg-success">In Stock</span>;
  };

  return (
     <div className={`d-flex vh-100 overflow-hidden ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar />
        <div className={`flex-grow-1 p-4 overflow-auto ${darkMode ? 'dark-mode' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">📊 Reports & Analytics</h3>
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={exportReport} disabled={loading}>
              <FaDownload className="me-2" />Export Report
            </button>
            <button className="btn btn-outline-primary" onClick={fetchAnalyticsData} disabled={loading}>
              <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} />Refresh
            </button>
          </div>
        </div>

        <div className="card p-3 mb-4 shadow-sm border-0">
          <div className="row align-items-end">
            <div className="col-md-4">
              <label className="form-label"><FaCalendarAlt className="me-2" />From Date</label>
              <input type="date" className="form-control" value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})} />
            </div>
            <div className="col-md-4">
              <label className="form-label"><FaCalendarAlt className="me-2" />To Date</label>
              <input type="date" className="form-control" value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})} />
            </div>
            <div className="col-md-4">
              <button className="btn btn-secondary w-100" onClick={() => setDateRange({ from: "", to: "" })}>
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card p-3 shadow-sm border-0 bg-primary bg-opacity-10">
                  <FaChartBar size={26} className="text-primary mb-2" />
                  <h6 className="text-muted">Total Revenue</h6>
                  <h4 className="mb-0">₹ {summary.totalRevenue.toFixed(2)}</h4>
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

            {/* Secondary Metrics */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card p-3 shadow-sm border-0 bg-info bg-opacity-10">
                  <FaChartLine size={22} className="text-info mb-2" />
                  <h6 className="text-muted">Total Bills</h6>
                  <h5>{summary.totalBills}</h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 shadow-sm border-0 bg-secondary bg-opacity-10">
                  <FaBoxes size={22} className="text-secondary mb-2" />
                  <h6 className="text-muted">Items Sold</h6>
                  <h5>{summary.totalItems}</h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 shadow-sm border-0 bg-dark bg-opacity-10">
                  <FaTachometerAlt size={22} className="text-dark mb-2" />
                  <h6 className="text-muted">Avg Bill Value</h6>
                  <h5>₹{(summary.totalRevenue / (summary.totalBills || 1)).toFixed(2)}</h5>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <div className="card p-4 shadow-sm border-0">
                  <h5 className="mb-3">Sales Overview</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                      <Bar dataKey="sales" fill="#13338f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-4 shadow-sm border-0">
                  <h5 className="mb-3">Payment Methods</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80} dataKey="value">
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

            {/* Product Lifecycle Heatmap */}
            <div className="card p-4 shadow-sm border-0 mb-4">
              <h5 className="mb-3">
                <FaHeartbeat className="text-danger me-2" />
                Product Lifecycle Heatmap
                <small className="text-muted ms-2">(AI Powered Analysis)</small>
              </h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th><th>Category</th><th>Stock</th><th>Sold</th><th>Lifecycle Stage</th><th>Urgency</th><th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifecycleData.slice(0, 10).map((p, idx) => (
                      <tr key={idx}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td className={p.stock === 0 ? "text-danger fw-bold" : ""}>{p.stock}</td>
                        <td>{p.sold}</td>
                        <td>
                          <span className="badge" style={{ background: p.color, color: "white" }}>
                            {p.icon} {p.stage}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${p.urgency === "High" ? "bg-danger" : p.urgency === "Medium" ? "bg-warning" : "bg-success"}`}>
                            {p.urgency}
                          </span>
                        </td>
                        <td>
                          {p.stage === "Low Stock - Popular" && "🔴 Immediate restock needed"}
                          {p.stage === "Out of Stock" && "⚠️ Reorder urgently"}
                          {p.stage === "Overstocked" && "💰 Run promotion / Bundle offer"}
                          {p.stage === "Slow Mover" && "📢 Markdown price / Bundle"}
                          {p.stage === "Best Seller" && "⭐ Keep well-stocked"}
                          {p.stage === "New Arrival" && "🆕 Promote on homepage"}
                          {p.stage === "Stable" && "✓ Maintain current levels"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Turnover Rate */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="card p-4 shadow-sm border-0">
                  <h5 className="mb-3">
                    <FaBrain className="text-info me-2" />
                    Fastest Moving Products
                    <small className="text-muted ms-2">(Turnover Rate)</small>
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr><th>Product</th><th>Turnover Rate</th><th>Est. Days to Sell Out</th></tr>
                      </thead>
                      <tbody>
                        {inventoryTurnover.map((p, idx) => (
                          <tr key={idx}>
                            <td>{p.name}</td>
                            <td>
                              <div className="progress" style={{ height: "8px" }}>
                                <div className="progress-bar bg-success" style={{ width: `${p.turnoverRate}%` }}></div>
                              </div>
                              <small>{p.turnoverRate}% sold of total stock</small>
                            </td>
                            <td>{p.daysToSell === 999 ? "> 30 days" : `${p.daysToSell} days`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card p-4 shadow-sm border-0">
                  <h5 className="mb-3">
                    <FaRobot className="text-warning me-2" />
                    AI Recommendations
                  </h5>
                  <div>
                    {lifecycleData.filter(p => p.urgency === "High").slice(0, 3).map((p, idx) => (
                      <div key={idx} className="list-group-item list-group-item-action border-0 mb-2 rounded" style={{ background: "#FFF3CD" }}>
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">⚠️ {p.name}</h6>
                          <small>{p.stage}</small>
                        </div>
                        <p className="mb-1">
                          {p.stage === "Low Stock - Popular" && `Only ${p.stock} units left! ${p.sold} sold. Order immediately.`}
                          {p.stage === "Out of Stock" && `Completely out of stock. ${p.sold} units were sold. Restock now.`}
                          {p.stage === "Overstocked" && `${p.stock} units in stock but only ${p.sold} sold. Consider a promotion.`}
                        </p>
                        <small className="text-muted">Action Required</small>
                      </div>
                    ))}
                    {lifecycleData.filter(p => p.urgency === "High").length === 0 && (
                      <div className="text-center py-3 text-success">
                        ✅ All products are in good health! No urgent actions needed.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TOP SELLING PRODUCTS */}
            <div className="card p-4 shadow-sm border-0 mb-4">
              <h5 className="mb-3"><FaFire className="text-danger me-2" />Top Selling Products</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th><th>Product</th><th>Category</th><th>Units Sold</th><th>Revenue</th><th>Current Stock</th><th>Min Stock</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSelling.length > 0 ? (
                      topSelling.map((p, index) => (
                        <tr key={p.id || index}>
                          <td>{index + 1}</td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.category}</td>
                          <td><span className="badge bg-primary">{p.sold}</span></td>
                          <td>₹{(p.revenue || 0).toFixed(2)}</td>
                          <td className={p.stock === 0 ? "text-danger fw-bold" : p.stock <= (p.minStock || 10) ? "text-warning fw-bold" : ""}>
                            {p.stock}
                          </td>
                          <td>{p.minStock || 10}</td>
                          <td>{getStockStatusBadge(p.stock, p.minStock || 10)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-3">No sales data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SLOW MOVING PRODUCTS */}
            <div className="card p-4 shadow-sm border-0 mb-4">
              <h5 className="mb-3"><FaSnowflake className="text-info me-2" />Slow Moving Products (High Stock, Low Sales)</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th><th>Product</th><th>Category</th><th>Units Sold</th><th>Current Stock</th><th>Stock Value</th><th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowMoving.length > 0 ? (
                      slowMoving.map((p, index) => (
                        <tr key={p.id || index}>
                          <td>{index + 1}</td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.category}</td>
                          <td><span className="badge bg-warning">{p.sold}</span></td>
                          <td className="text-danger fw-bold">{p.stock}</td>
                          <td>₹{(p.stock * p.cost).toFixed(2)}</td>
                          <td>
                            {p.sold === 0 ? (
                              <span className="badge bg-danger">🔥 Markdown 40% OFF</span>
                            ) : p.stock > p.sold * 5 ? (
                              <span className="badge bg-warning">💰 Buy 1 Get 1 Free</span>
                            ) : (
                              <span className="badge bg-info">📢 Bundle with bestseller</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-3">No slow moving products - Great inventory management!</td>
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