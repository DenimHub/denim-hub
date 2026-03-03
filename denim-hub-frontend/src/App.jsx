import "./styles/theme.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductView from "./components/ProductView";
import Billing from "./pages/Billing";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import SalesReport from "./pages/SalesReport";
import BillsReport from "./pages/BillsReport";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import AddProduct from "./pages/AddProduct";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/changePassword" element={<ChangePassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="//products/add" element={<AddProduct />} />
        <Route path="/products/view/:id" element={<ProductView />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/salesReport" element={<SalesReport />} />
        <Route path="/billsReport" element={<BillsReport />} />
        <Route path="/reportsAnalytics" element={<ReportsAnalytics />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
