import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBox,
  FaRupeeSign,
  FaShoppingBag,
  FaExclamationTriangle,
  FaChartPie,
  FaTshirt,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaChartLine,
  FaCalendarDay,
  FaFire,
  FaClock,
  FaStar,
} from "react-icons/fa";

import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import axios from "axios";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalStock: 0,
    todaySales: 0,
    yesterdaySales: 0,
    lowStockItems: 0,
    monthlySales: 0,
    previousMonthSales: 0,
    topProduct: { name: "N/A", sold: 0, revenue: 0 },
    topCategory: { name: "N/A", count: 0 }
  });

  const [categorySales, setCategorySales] = useState([]);
  const [stockDistribution, setStockDistribution] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const COLORS = ['#13338f', '#4c6fd3', '#d9534f', '#28a745', '#ffc107', '#17a2b8'];

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const productsResponse = await axios.get("http://localhost:8080/api/products");
      const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      
      const billsResponse = await axios.get("http://localhost:8080/api/bills");
      const bills = Array.isArray(billsResponse.data) ? billsResponse.data : [];
      
      calculateDashboardMetrics(products, bills);
      
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculateDashboardMetrics = (products, bills) => {
    // Basic calculations
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stockQty || 0), 0);
    
    // Low stock items
    const lowStock = products.filter(p => (p.stockQty || 0) <= (p.minStock || 10));
    const lowStockCount = lowStock.length;
    setLowStockProducts(lowStock.slice(0, 5));
    
    // Sales calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todaySales = bills
      .filter(bill => new Date(bill.billDate) >= today)
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    const yesterdaySales = bills
      .filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= yesterday && billDate < today;
      })
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    // Monthly sales
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const monthlySales = bills
      .filter(bill => new Date(bill.billDate) >= monthStart)
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    const previousMonthSales = bills
      .filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= prevMonthStart && billDate <= prevMonthEnd;
      })
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    // Category analysis
    const categorySalesMap = new Map();
    bills.forEach(bill => {
      if (bill.items) {
        bill.items.forEach(item => {
          const category = item.product?.category || 'Uncategorized';
          categorySalesMap.set(category, (categorySalesMap.get(category) || 0) + (item.total || 0));
        });
      }
    });
    
    const catSales = Array.from(categorySalesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    setCategorySales(catSales);
    
    // Stock distribution
    const inStock = products.filter(p => (p.stockQty || 0) > (p.minStock || 10)).length;
    const lowStockCount_dist = products.filter(p => {
      const stock = p.stockQty || 0;
      const minStock = p.minStock || 10;
      return stock > 0 && stock <= minStock;
    }).length;
    const outOfStock = products.filter(p => (p.stockQty || 0) === 0).length;
    
    setStockDistribution([
      { name: "Healthy Stock", value: inStock },
      { name: "Low Stock", value: lowStockCount_dist },
      { name: "Out of Stock", value: outOfStock }
    ]);
    
    // Top products
    const productSalesMap = new Map();
    bills.forEach(bill => {
      if (bill.items) {
        bill.items.forEach(item => {
          const productId = item.product?.id;
          const productName = item.product?.name || 'Unknown';
          if (productId) {
            if (!productSalesMap.has(productId)) {
              productSalesMap.set(productId, {
                id: productId,
                name: productName,
                sold: 0,
                revenue: 0
              });
            }
            const prod = productSalesMap.get(productId);
            prod.sold += item.quantity || 0;
            prod.revenue += item.total || 0;
          }
        });
      }
    });
    
    const topProductsList = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    setTopProducts(topProductsList);
    
    // Weekly trend
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySales = bills
        .filter(bill => {
          const billDate = new Date(bill.billDate);
          return billDate >= date && billDate < nextDate;
        })
        .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      
      weekData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: daySales
      });
    }
    setWeeklyTrend(weekData);
    
    // Recent sales
    const recent = [...bills]
      .sort((a, b) => new Date(b.billDate) - new Date(a.billDate))
      .slice(0, 5);
    setRecentSales(recent);
    
    // Dashboard summary
    setDashboardData({
      totalProducts,
      totalStock,
      todaySales,
      yesterdaySales,
      lowStockItems: lowStockCount,
      monthlySales,
      previousMonthSales,
      topProduct: topProductsList[0] || { name: "N/A", sold: 0, revenue: 0 },
      topCategory: {
        name: catSales[0]?.name || 'N/A',
        count: catSales[0]?.value || 0
      }
    });
  };

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return { value: 100, icon: FaArrowUp, color: 'text-success' };
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { value: change.toFixed(1), icon: FaArrowUp, color: 'text-success' };
    if (change < 0) return { value: Math.abs(change).toFixed(1), icon: FaArrowDown, color: 'text-danger' };
    return { value: 0, icon: FaMinus, color: 'text-secondary' };
  };

  const todayChange = getPercentageChange(dashboardData.todaySales, dashboardData.yesterdaySales);
  const monthlyChange = getPercentageChange(dashboardData.monthlySales, dashboardData.previousMonthSales);

  if (loading) {
    return (
      <div className="d-flex vh-100 overflow-hidden">
        <Sidebar />
        <div className="flex-grow-1 p-4 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto bg-light">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Dashboard</h3>
          <div className="d-flex gap-2">
            <div className="btn-group">
              <button 
                className={`btn btn-sm ${selectedPeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setSelectedPeriod('week')}
              >
                Week
              </button>
              <button 
                className={`btn btn-sm ${selectedPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setSelectedPeriod('month')}
              >
                Month
              </button>
              <button 
                className={`btn btn-sm ${selectedPeriod === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setSelectedPeriod('year')}
              >
                Year
              </button>
            </div>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={fetchDashboardData}
            >
              <FaChartLine className="me-1" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Cards - Same style as before */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0">
              <div className="d-flex justify-content-between">
                <div>
                  <FaBox size={28} className="text-primary mb-2" />
                  <h6 className="text-muted">Total Products</h6>
                  <h4 className="mb-0">{dashboardData.totalProducts}</h4>
                </div>
                <div className="bg-light p-2 rounded">
                  <FaShoppingBag className="text-secondary" />
                </div>
              </div>
              <small className="text-muted mt-2">{dashboardData.totalStock} units in stock</small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0">
              <div className="d-flex justify-content-between">
                <div>
                  <FaRupeeSign size={28} className="text-success mb-2" />
                  <h6 className="text-muted">Today's Sales</h6>
                  <h4 className="mb-0">₹{dashboardData.todaySales.toFixed(2)}</h4>
                </div>
                <div className={`d-flex align-items-center ${todayChange.color}`}>
                  <todayChange.icon className="me-1" />
                  <span>{todayChange.value}%</span>
                </div>
              </div>
              <small className="text-muted">vs ₹{dashboardData.yesterdaySales.toFixed(2)} yesterday</small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0">
              <div className="d-flex justify-content-between">
                <div>
                  <FaChartLine size={28} className="text-info mb-2" />
                  <h6 className="text-muted">Monthly Revenue</h6>
                  <h4 className="mb-0">₹{dashboardData.monthlySales.toFixed(2)}</h4>
                </div>
                <div className={`d-flex align-items-center ${monthlyChange.color}`}>
                  <monthlyChange.icon className="me-1" />
                  <span>{monthlyChange.value}%</span>
                </div>
              </div>
              <small className="text-muted">vs last month</small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0">
              <div className="d-flex justify-content-between">
                <div>
                  <FaExclamationTriangle size={28} className="text-danger mb-2" />
                  <h6 className="text-muted">Low Stock Items</h6>
                  <h4 className="mb-0">{dashboardData.lowStockItems}</h4>
                </div>
              </div>
              <small className="text-muted">Need attention</small>
            </div>
          </div>
        </div>

        {/* Secondary Metrics - Simple but eye-catching */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card p-3 shadow-sm border-0 bg-primary bg-opacity-10">
              <div className="d-flex align-items-center">
                <FaStar className="text-warning me-3" size={24} />
                <div>
                  <h6 className="text-muted mb-1">Top Product</h6>
                  <h5 className="mb-0">{dashboardData.topProduct.name}</h5>
                  <small>{dashboardData.topProduct.sold} units sold</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card p-3 shadow-sm border-0 bg-success bg-opacity-10">
              <div className="d-flex align-items-center">
                <FaChartPie className="text-success me-3" size={24} />
                <div>
                  <h6 className="text-muted mb-1">Top Category</h6>
                  <h5 className="mb-0">{dashboardData.topCategory.name}</h5>
                  <small>₹{dashboardData.topCategory.count.toFixed(2)} sales</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card p-3 shadow-sm border-0 bg-warning bg-opacity-10">
              <div className="d-flex align-items-center">
                <FaCalendarDay className="text-warning me-3" size={24} />
                <div>
                  <h6 className="text-muted mb-1">Average Daily</h6>
                  <h5 className="mb-0">₹{(dashboardData.monthlySales / 30).toFixed(2)}</h5>
                  <small>Last 30 days</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row - Simple but effective */}
        <div className="row g-4 mb-4">
          <div className="col-md-7">
            <div className="card p-4 shadow-sm border-0">
              <h5 className="mb-3">Sales Trend (Last 7 Days)</h5>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="day" stroke="#6c757d" />
                  <YAxis stroke="#6c757d" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#13338f" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#13338f' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-md-5">
            <div className="card p-4 shadow-sm border-0">
              <h5 className="mb-3">Stock Health</h5>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stockDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stockDistribution.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card p-4 shadow-sm border-0">
              <h5 className="mb-3">
                <FaFire className="text-danger me-2" />
                Top Selling Products
              </h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th className="text-center">Sold</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td>{index + 1}</td>
                        <td>{product.name}</td>
                        <td className="text-center">
                          <span className="badge bg-info bg-opacity-25 text-dark">
                            {product.sold}
                          </span>
                        </td>
                        <td className="text-end fw-bold text-primary">₹{product.revenue.toFixed(2)}</td>
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
                <FaClock className="text-info me-2" />
                Recent Transactions
              </h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Bill No</th>
                      <th>Customer</th>
                      <th className="text-end">Amount</th>
                      <th className="text-center">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <span className="badge bg-secondary bg-opacity-25 text-dark">
                            {sale.saleNo?.slice(-6)}
                          </span>
                        </td>
                        <td>{sale.customer?.name || 'Walk-in'}</td>
                        <td className="text-end fw-bold text-success">₹{sale.totalAmount}</td>
                        <td className="text-center text-muted small">
                          {new Date(sale.billDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Banner - Subtle but noticeable */}
        {dashboardData.lowStockItems > 0 && (
          <div className="alert alert-warning mt-4 d-flex align-items-center">
            <FaExclamationTriangle className="me-3" size={20} />
            <div className="flex-grow-1">
              <strong>Low Stock Alert!</strong> You have {dashboardData.lowStockItems} product
              {dashboardData.lowStockItems > 1 ? 's' : ''} running low on stock.
              <a href="/inventory" className="alert-link ms-2">View Inventory →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;