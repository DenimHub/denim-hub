import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBox,
  FaWarehouse,
  FaFileInvoice,
  FaShoppingCart,
  FaChartBar,
  FaSignOutAlt,
  FaUsers,
  FaTicketAlt,
  FaMoon,
  FaSun
} from "react-icons/fa";
import { FaChartSimple } from "react-icons/fa6";
import { IoAnalytics } from "react-icons/io5";
import { useDarkMode } from "../context/DarkModeContext";

function Sidebar() {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div
      className="theme-bg-primary text-white vh-100 d-flex flex-column"
      style={{ width: "250px" }}
    >
      <div className="p-3 text-center border-bottom">
        <div className="d-flex align-items-center justify-content-center mb-2">
          <img 
            src="/Logo1.jpg" 
            alt="Denim Hub Logo" 
            style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "8px",
              objectFit: "cover",
              marginRight: "10px"
            }} 
          />
          <h4 className="mb-0">Denim Hub</h4>
        </div>
        <small className="text-light">Inventory System</small>
      </div>

      <ul className="nav nav-pills flex-column gap-2 p-3 flex-grow-1">
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/dashboard">
            <FaTachometerAlt className="me-2" />
            Dashboard
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/products">
            <FaBox className="me-2" />
            Products
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/inventory">
            <FaWarehouse className="me-2" />
            Inventory
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/billing">
            <FaFileInvoice className="me-2" />
            Billing
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/customers">
            <FaUsers className="me-2" />
            Customers
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/salesReport">
            <FaChartBar className="me-2" />
            Sales Reports
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/billsReport">
            <FaChartSimple className="me-2" />
            Bills Reports
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/reportsAnalytics">
            <IoAnalytics className="me-2" />
            Reports Analytics
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/coupons">
            <FaTicketAlt className="me-2" />
            Coupons
          </NavLink>
        </li>
        
        {/* Dark Mode Icon - Clean, no border, no extra space */}
        <li className="nav-item mt-auto">
          <button
            onClick={toggleDarkMode}
            className="nav-link text-white w-100 text-start"
            style={{ 
              background: "transparent", 
              border: "none",
              cursor: "pointer"
            }}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? <FaSun className="me-2" /> : <FaMoon className="me-2" />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </li>
      </ul>

      <div className="p-3 border-top">
        <NavLink className="nav-link text-white" to="/login">
          <FaSignOutAlt className="me-2" />
          Logout
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;