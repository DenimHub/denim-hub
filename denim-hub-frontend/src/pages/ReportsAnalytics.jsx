import { useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaChartBar,
  FaRupeeSign,
  FaFire,
  FaSnowflake,
  FaBoxes
} from "react-icons/fa";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

/* ---------------- SAMPLE DATA ---------------- */

const salesData = [
  { period: "Daily", sales: 45000 },
  { period: "Weekly", sales: 280000 },
  { period: "Monthly", sales: 1100000 }
];

const productPerformance = [
  { name: "Blue Denim Jeans", sold: 120, stock: 50, cost: 900, price: 1500 },
  { name: "Slim Fit Shirt", sold: 30, stock: 8, cost: 700, price: 1200 },
  { name: "Denim Jacket", sold: 15, stock: 3, cost: 1500, price: 2500 },
  { name: "Black Jeans", sold: 5, stock: 25, cost: 1000, price: 1600 }
];

function ReportsAnalytics() {

  /* ---------- CALCULATIONS ---------- */

  const totalMonthlySales = salesData.find(
    (s) => s.period === "Monthly"
  ).sales;

  const totalProfit = productPerformance.reduce(
    (sum, p) => sum + (p.price - p.cost) * p.sold,
    0
  );

  const topSelling = [...productPerformance]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 3);

  const slowMoving = [...productPerformance]
    .sort((a, b) => a.sold - b.sold)
    .slice(0, 3);

  const stockValuation = productPerformance.reduce(
    (sum, p) => sum + p.stock * p.cost,
    0
  );

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <h3 className="mb-4">Reports & Analytics</h3>

        {/* ---------- SUMMARY CARDS ---------- */}

        <div className="row g-3 mb-4">

          <div className="col-md-3">
            <div className="card p-3 shadow-sm">
              <FaChartBar size={26} className="text-primary mb-2" />
              <h6>Monthly Sales</h6>
              <h4>₹ {totalMonthlySales}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm">
              <FaRupeeSign size={26} className="text-success mb-2" />
              <h6>Total Profit</h6>
              <h4>₹ {totalProfit}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm">
              <FaFire size={26} className="text-danger mb-2" />
              <h6>Top Product</h6>
              <h6>{topSelling[0].name}</h6>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm">
              <FaBoxes size={26} className="text-warning mb-2" />
              <h6>Stock Valuation</h6>
              <h4>₹ {stockValuation}</h4>
            </div>
          </div>

        </div>

        {/* ---------- SALES BAR CHART ---------- */}

        <div className="card p-4 shadow-sm mb-4">
          <h5 className="mb-3">Sales Overview</h5>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#13338f" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ---------- TOP SELLING ---------- */}

        <div className="card p-4 shadow-sm mb-4">
          <h5 className="mb-3">Top Selling Products</h5>

          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Units Sold</th>
              </tr>
            </thead>
            <tbody>
              {topSelling.map((p, index) => (
                <tr key={p.name}>
                  <td>{index + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---------- SLOW MOVING ---------- */}

        <div className="card p-4 shadow-sm mb-4">
          <h5 className="mb-3">
            <FaSnowflake className="me-2 text-info" />
            Slow Moving Products
          </h5>

          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Units Sold</th>
              </tr>
            </thead>
            <tbody>
              {slowMoving.map((p, index) => (
                <tr key={p.name}>
                  <td>{index + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default ReportsAnalytics;
