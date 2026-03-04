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
  FaTag,
  FaWarehouse,
  FaClock,
  FaStar,
  FaBolt,
  FaEllipsisV
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
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
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
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');

  const MODERN_COLORS = {
    primary: ['#4158D0', '#C850C0'],
    secondary: ['#0093E9', '#80D0C7'],
    success: ['#00B09B', '#96C93D'],
    warning: ['#FA8BFF', '#2BD2FF', '#2BFF88'],
    danger: ['#FF416C', '#FF4B2B'],
    info: ['#3B41C5', '#A981BB'],
    chart: ['#4158D0', '#FF5858', '#FFB800', '#00C9A7', '#FF6B6B', '#4ECDC4']
  };

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
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const calculateDashboardMetrics = (products, bills) => {
    // Basic calculations (same as before)
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
    if (previous === 0) return { value: 100, icon: FaArrowUp, color: '#00C9A7' };
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { value: change.toFixed(1), icon: FaArrowUp, color: '#00C9A7' };
    if (change < 0) return { value: Math.abs(change).toFixed(1), icon: FaArrowDown, color: '#FF6B6B' };
    return { value: 0, icon: FaMinus, color: '#94A3B8' };
  };

  const todayChange = getPercentageChange(dashboardData.todaySales, dashboardData.yesterdaySales);
  const monthlyChange = getPercentageChange(dashboardData.monthlySales, dashboardData.previousMonthSales);

  // Modern Metric Card Component
  const MetricCard = ({ title, value, icon: Icon, trend, color, subtitle, bgGradient }) => (
    <div className="metric-card" style={{
      background: bgGradient || `linear-gradient(135deg, ${color}15, ${color}05)`,
      borderRadius: '24px',
      padding: '24px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 30px 50px -20px rgba(0,0,0,0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(0,0,0,0.2)';
    }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            <Icon />
          </div>
          {trend && (
            <div className="d-flex align-items-center" style={{ color: trend.color, background: `${trend.color}15`, padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
              <trend.icon className="me-1" size={14} />
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <h6 style={{ color: '#64748B', fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px', marginBottom: '8px' }}>{title}</h6>
        <h2 style={{ color: '#1E293B', fontSize: '32px', fontWeight: '700', marginBottom: subtitle ? '4px' : '0' }}>{value}</h2>
        {subtitle && <small style={{ color: '#94A3B8', fontSize: '13px' }}>{subtitle}</small>}
      </div>
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}10, transparent 70%)`,
        zIndex: 0
      }} />
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex vh-100 overflow-hidden">
        <Sidebar />
        <div className="flex-grow-1 p-4 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 style={{ color: '#0F172A', fontWeight: '700', marginBottom: '4px' }}>Dashboard Overview</h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Welcome back! Here's what's happening with your store today.</p>
          </div>
          <div className="d-flex gap-2">
            <div className="btn-group me-2">
              <button 
                className={`btn ${selectedTimeRange === 'week' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedTimeRange('week')}
                style={{ borderRadius: '12px 0 0 12px' }}
              >
                Week
              </button>
              <button 
                className={`btn ${selectedTimeRange === 'month' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedTimeRange('month')}
                style={{ borderRadius: '0' }}
              >
                Month
              </button>
              <button 
                className={`btn ${selectedTimeRange === 'year' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedTimeRange('year')}
                style={{ borderRadius: '0 12px 12px 0' }}
              >
                Year
              </button>
            </div>
            <button 
              className="btn" 
              onClick={fetchDashboardData}
              style={{ 
                background: 'white', 
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '8px 20px',
                color: '#1E293B',
                fontWeight: '500'
              }}
            >
              <FaChartLine className="me-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <MetricCard
              title="Total Products"
              value={dashboardData.totalProducts}
              icon={FaBox}
              color="#4158D0"
              subtitle={`${dashboardData.totalStock} total units`}
            />
          </div>
          <div className="col-md-3">
            <MetricCard
              title="Today's Sales"
              value={`₹${dashboardData.todaySales.toFixed(2)}`}
              icon={FaRupeeSign}
              color="#00B09B"
              trend={todayChange}
              subtitle={`vs ₹${dashboardData.yesterdaySales.toFixed(2)} yesterday`}
            />
          </div>
          <div className="col-md-3">
            <MetricCard
              title="Monthly Revenue"
              value={`₹${dashboardData.monthlySales.toFixed(2)}`}
              icon={FaChartLine}
              color="#FF5858"
              trend={monthlyChange}
              subtitle="vs last month"
            />
          </div>
          <div className="col-md-3">
            <MetricCard
              title="Low Stock Items"
              value={dashboardData.lowStockItems}
              icon={FaExclamationTriangle}
              color="#FFB800"
              subtitle="Need attention"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="row g-4 mb-4">
          <div className="col-md-8">
            <div className="card border-0" style={{ 
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 style={{ color: '#1E293B', fontWeight: '600' }}>Revenue Trend</h5>
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center">
                      <span style={{ width: '8px', height: '8px', background: '#4158D0', borderRadius: '4px', marginRight: '6px' }}></span>
                      <small style={{ color: '#64748B' }}>This Week</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <span style={{ width: '8px', height: '8px', background: '#94A3B8', borderRadius: '4px', marginRight: '6px' }}></span>
                      <small style={{ color: '#64748B' }}>Last Week</small>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyTrend}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4158D0" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4158D0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="fullDate" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none',
                        boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#4158D0" 
                      strokeWidth={3}
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0" style={{ 
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)',
              height: '100%'
            }}>
              <div className="card-body p-4">
                <h5 style={{ color: '#1E293B', fontWeight: '600', marginBottom: '20px' }}>Stock Health</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stockDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stockDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MODERN_COLORS.chart[index % MODERN_COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3">
                  {stockDistribution.map((item, index) => (
                    <div key={item.name} className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          background: MODERN_COLORS.chart[index % MODERN_COLORS.chart.length], 
                          borderRadius: '5px',
                          marginRight: '8px' 
                        }}></span>
                        <span style={{ color: '#475569' }}>{item.name}</span>
                      </div>
                      <span style={{ color: '#1E293B', fontWeight: '600' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card border-0" style={{ 
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 style={{ color: '#1E293B', fontWeight: '600' }}>
                    <FaFire className="me-2" style={{ color: '#FF5858' }} />
                    Top Products
                  </h5>
                  <FaEllipsisV style={{ color: '#94A3B8', cursor: 'pointer' }} />
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>
                        <th>Product</th>
                        <th className="text-center">Sold</th>
                        <th className="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => (
                        <tr key={product.id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '10px', 
                                background: `linear-gradient(135deg, ${MODERN_COLORS.chart[index % MODERN_COLORS.chart.length]}20, ${MODERN_COLORS.chart[index % MODERN_COLORS.chart.length]}05)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                color: MODERN_COLORS.chart[index % MODERN_COLORS.chart.length],
                                fontWeight: '600',
                                fontSize: '14px'
                              }}>
                                {index + 1}
                              </div>
                              <span style={{ color: '#1E293B', fontWeight: '500' }}>{product.name}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span style={{ background: '#F1F5F9', padding: '4px 12px', borderRadius: '20px', color: '#475569', fontSize: '13px', fontWeight: '500' }}>
                              {product.sold}
                            </span>
                          </td>
                          <td className="text-end fw-bold" style={{ color: '#4158D0' }}>₹{product.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0" style={{ 
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 style={{ color: '#1E293B', fontWeight: '600' }}>
                    <FaClock className="me-2" style={{ color: '#00B09B' }} />
                    Recent Transactions
                  </h5>
                  <FaEllipsisV style={{ color: '#94A3B8', cursor: 'pointer' }} />
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>
                        <th>Bill No</th>
                        <th>Customer</th>
                        <th className="text-end">Amount</th>
                        <th className="text-center">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((sale) => (
                        <tr key={sale.id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <td>
                            <span style={{ 
                              background: '#F1F5F9', 
                              padding: '4px 8px', 
                              borderRadius: '6px', 
                              color: '#475569', 
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}>
                              {sale.saleNo?.slice(-6)}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: '#1E293B', fontWeight: '500' }}>{sale.customer?.name || 'Walk-in'}</span>
                          </td>
                          <td className="text-end fw-bold" style={{ color: '#00B09B' }}>₹{sale.totalAmount}</td>
                          <td className="text-center">
                            <small style={{ color: '#94A3B8' }}>
                              {new Date(sale.billDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {dashboardData.lowStockItems > 0 && (
          <div className="mt-4" style={{
            background: 'linear-gradient(135deg, #FFB80010, #FF585810)',
            borderRadius: '16px',
            padding: '16px 24px',
            border: '1px solid #FFB80030',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FFB800, #FF5858)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              <FaExclamationTriangle />
            </div>
            <div className="flex-grow-1">
              <h6 style={{ color: '#1E293B', marginBottom: '4px', fontWeight: '600' }}>Low Stock Alert</h6>
              <p style={{ color: '#475569', marginBottom: '0', fontSize: '14px' }}>
                You have {dashboardData.lowStockItems} product{dashboardData.lowStockItems > 1 ? 's' : ''} running low on stock. 
                <a href="/inventory" style={{ color: '#4158D0', textDecoration: 'none', marginLeft: '8px', fontWeight: '500' }}>View Inventory →</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;