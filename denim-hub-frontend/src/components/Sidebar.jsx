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
} from "react-icons/fa";

import { FaChartSimple } from "react-icons/fa6";
import { IoAnalytics } from "react-icons/io5";

function Sidebar() {
  return (
    <div
      className="theme-bg-primary text-white vh-100 d-flex flex-column"
      style={{ width: "250px" }}
    >
      <div className="p-3 text-center border-bottom">
        <h4 className="mb-0">Denim Hub</h4>
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
