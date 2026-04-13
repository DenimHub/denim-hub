import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { useDarkMode } from "../context/DarkModeContext";
import { 
  FaBoxes, 
  FaExclamationTriangle, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaSync,
  FaFilePdf,
  FaFileCsv,
  FaDownload
} from "react-icons/fa";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { useToast } from "../context/ToastContext";

function Inventory() {
    const { darkMode } = useDarkMode();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingSize, setEditingSize] = useState(null);
  const [editStockValue, setEditStockValue] = useState("");
  const [editMinStockValue, setEditMinStockValue] = useState("");
  const [summary, setSummary] = useState({
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalProducts: 0
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const { showToast } = useToast();

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");
      
      const productsResponse = await axios.get("http://localhost:8080/api/inventory");
      setProducts(productsResponse.data);
      
      // Calculate summary based on individual sizes
      let totalStock = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      
      productsResponse.data.forEach(product => {
        product.sizes?.forEach(size => {
          totalStock += size.stockQty || 0;
          if ((size.stockQty || 0) <= 0) {
            outOfStockCount++;
          } else if ((size.stockQty || 0) <= (product.minStock || 10)) {
            lowStockCount++;
          }
        });
      });
      
      setSummary({
        totalStock: totalStock,
        lowStockCount: lowStockCount,
        outOfStockCount: outOfStockCount,
        totalProducts: productsResponse.data.length
      });
      
    } catch (err) {
      console.error("Error fetching inventory:", err);
      if (err.request) {
        setError("Cannot connect to server. Make sure backend is running on port 8080");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Edit individual size stock
  const handleEditSizeStock = (product, sizeObj) => {
    setEditingProductId(product.id);
    setEditingSize(sizeObj.size);
    setEditStockValue(sizeObj.stockQty);
  };

  const saveSizeStock = async (productId, size) => {
    try {
      await axios.put(`http://localhost:8080/api/inventory/${productId}/stock`, {
        size: size,
        stockQty: parseInt(editStockValue)
      });
      await fetchInventory();
      showToast(`✅ Stock updated for size ${size}`, "success");
      setEditingProductId(null);
      setEditingSize(null);
      setEditStockValue("");
    } catch (err) {
      console.error("Error updating size stock:", err);
      showToast("❌ Failed to update stock", "error");
    }
  };

  // Edit Min Stock for product
  const handleEditMinStock = (product) => {
    setEditingProductId(product.id);
    setEditMinStockValue(product.minStock || 10);
    setEditingSize(null);
  };

  const saveMinStock = async (productId) => {
    try {
      await axios.put(`http://localhost:8080/api/inventory/${productId}/min-stock`, {
        minStock: parseInt(editMinStockValue)
      });
      await fetchInventory();
      showToast("✅ Minimum stock alert updated", "success");
      setEditingProductId(null);
      setEditMinStockValue("");
    } catch (err) {
      console.error("Error updating min stock:", err);
      showToast("❌ Failed to update minimum stock", "error");
    }
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setEditingSize(null);
    setEditStockValue("");
    setEditMinStockValue("");
  };

  // Get status badge for individual size
  const getSizeStatus = (stock, minStock) => {
    const stockNum = stock || 0;
    const minStockNum = minStock || 10;
    
    if (stockNum <= 0) {
      return { text: "Out of Stock", badge: "bg-dark", icon: "🔴" };
    } else if (stockNum <= minStockNum) {
      return { text: "Low Stock", badge: "bg-danger", icon: "⚠️" };
    } else if (stockNum <= minStockNum * 2) {
      return { text: "Medium Stock", badge: "bg-warning text-dark", icon: "🟡" };
    } else {
      return { text: "In Stock", badge: "bg-success", icon: "🟢" };
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("Inventory Report", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const today = new Date().toLocaleDateString();
      doc.text(`Generated on: ${today}`, 14, 28);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Products: ${summary.totalProducts}`, 14, 38);
      doc.text(`Total Stock Units: ${summary.totalStock}`, 14, 45);
      doc.text(`Low Stock Items: ${summary.lowStockCount}`, 14, 52);
      doc.text(`Out of Stock Items: ${summary.outOfStockCount}`, 14, 59);
      
      const tableData = [];
      products.forEach((product) => {
        product.sizes?.forEach(size => {
          const status = getSizeStatus(size.stockQty, product.minStock);
          tableData.push([
            product.name,
            product.category,
            size.size,
            size.stockQty,
            product.minStock || 10,
            status.text
          ]);
        });
      });
      
      autoTable(doc, {
        startY: 70,
        head: [['Product Name', 'Category', 'Size', 'Stock', 'Min Stock', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      doc.save(`inventory-report-${today.replace(/\//g, '-')}.pdf`);
      showToast("✅ PDF exported successfully", "success");
    } catch (err) {
      console.error("Error exporting to PDF:", err);
      showToast("❌ Failed to export PDF", "error");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const csvData = [];
      products.forEach(product => {
        product.sizes?.forEach(size => {
          const status = getSizeStatus(size.stockQty, product.minStock);
          csvData.push({
            'Product Name': product.name,
            'Category': product.category,
            'Size': size.size,
            'Current Stock': size.stockQty,
            'Min Stock': product.minStock || 10,
            'Status': status.text
          });
        });
      });
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("✅ CSV exported successfully", "success");
    } catch (err) {
      console.error("Error exporting to CSV:", err);
      showToast("❌ Failed to export CSV", "error");
    }
  };

  const toggleExportMenu = () => {
    setShowExportMenu(!showExportMenu);
  };

  return (
        <div className={`d-flex vh-100 overflow-hidden ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar />

      <div className={`flex-grow-1 p-4 overflow-auto ${darkMode ? 'dark-mode' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">📦 Inventory Management</h3>
          
          <div className="d-flex gap-2">
            <div className="position-relative" ref={exportMenuRef}>
              <button className="btn btn-success" onClick={toggleExportMenu}>
                <FaDownload className="me-2" />Export
              </button>
              {showExportMenu && (
                <div className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border" style={{ minWidth: "180px", zIndex: 1000 }}>
                  <button className="btn w-100 text-start px-3 py-2 border-0 bg-transparent hover-bg-light"
                    onClick={() => { exportToPDF(); setShowExportMenu(false); }}>
                    <FaFilePdf className="text-danger me-2" />Export as PDF
                  </button>
                  <button className="btn w-100 text-start px-3 py-2 border-0 bg-transparent hover-bg-light"
                    onClick={() => { exportToCSV(); setShowExportMenu(false); }}>
                    <FaFileCsv className="text-success me-2" />Export as CSV
                  </button>
                </div>
              )}
            </div>
            
            <button className="btn btn-outline-primary" onClick={fetchInventory} disabled={loading}>
              <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} />Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-primary bg-opacity-10">
              <FaBoxes size={28} className="mb-2 text-primary" />
              <h6 className="text-muted">Total Stock Units</h6>
              <h4 className="mb-0">{summary.totalStock}</h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-warning bg-opacity-10">
              <FaExclamationTriangle size={28} className="mb-2 text-warning" />
              <h6 className="text-muted">Low Stock Items</h6>
              <h4 className="mb-0">{summary.lowStockCount}</h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-danger bg-opacity-10">
              <FaExclamationTriangle size={28} className="mb-2 text-danger" />
              <h6 className="text-muted">Out of Stock</h6>
              <h4 className="mb-0">{summary.outOfStockCount}</h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-success bg-opacity-10">
              <FaBoxes size={28} className="mb-2 text-success" />
              <h6 className="text-muted">Total Products</h6>
              <h4 className="mb-0">{summary.totalProducts}</h4>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center">
            <FaExclamationTriangle className="me-2" size={20} />
            <div className="flex-grow-1">{error}</div>
            <button className="btn btn-sm btn-outline-danger" onClick={fetchInventory}>Retry</button>
          </div>
        )}

        {/* Inventory Table - Size-wise view */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0">Stock Details (Size-wise)</h5>
          </div>
          
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Size</th>
                      <th>Current Stock</th>
                      <th>Min Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length > 0 ? (
                      products.map((product) => (
                        product.sizes?.map((size, idx) => {
                          const status = getSizeStatus(size.stockQty, product.minStock);
                          const isEditing = (editingProductId === product.id && editingSize === size.size);
                          
                          return (
                            <tr key={`${product.id}-${size.size}`}>
                              {idx === 0 && (
                                <>
                                  <td rowSpan={product.sizes.length}>
                                    <div className="d-flex align-items-center">
                                      {product.imageUrl && (
                                        <img src={`http://localhost:8080${product.imageUrl}`} width="30" height="30"
                                          style={{ objectFit: "cover", borderRadius: "4px", marginRight: "8px" }}
                                          onError={(e) => e.target.style.display = "none"} />
                                      )}
                                      <strong>{product.name}</strong>
                                    </div>
                                  </td>
                                  <td rowSpan={product.sizes.length}>{product.category}</td>
                                </>
                              )}
                              <td className="fw-bold">{size.size}</td>
                              <td>
                                {isEditing ? (
                                  <div className="d-flex gap-1" style={{ width: "120px" }}>
                                    <input type="number" className="form-control form-control-sm" 
                                      value={editStockValue} onChange={(e) => setEditStockValue(e.target.value)} 
                                      min="0" style={{ width: "80px" }} />
                                    <button className="btn btn-sm btn-success" onClick={() => saveSizeStock(product.id, size.size)}>
                                      <FaSave size={12} />
                                    </button>
                                    <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                                      <FaTimes size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <span className={`fw-bold ${size.stockQty <= 0 ? "text-danger" : size.stockQty <= (product.minStock || 10) ? "text-warning" : "text-success"}`}>
                                    {size.stockQty}
                                  </span>
                                )}
                              </td>
                              <td>
                                {editingProductId === product.id && !editingSize ? (
                                  <div className="d-flex gap-1" style={{ width: "120px" }}>
                                    <input type="number" className="form-control form-control-sm" 
                                      value={editMinStockValue} onChange={(e) => setEditMinStockValue(e.target.value)} 
                                      min="0" style={{ width: "80px" }} />
                                    <button className="btn btn-sm btn-success" onClick={() => saveMinStock(product.id)}>
                                      <FaSave size={12} />
                                    </button>
                                    <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                                      <FaTimes size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="d-flex align-items-center gap-2">
                                    <span>{product.minStock || 10}</span>
                                    {idx === 0 && (
                                      <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditMinStock(product)}>
                                        <FaEdit size={12} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${status.badge}`}>
                                  {status.icon} {status.text}
                                </span>
                              </td>
                              <td>
                                {!isEditing && (
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditSizeStock(product, size)}>
                                    <FaEdit size={14} /> Edit Stock
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">No inventory data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {summary.lowStockCount > 0 && (
          <div className="alert alert-warning mt-4 d-flex align-items-center">
            <FaExclamationTriangle className="me-2" size={20} />
            <div>
              <strong>Low Stock Alert!</strong> There {summary.lowStockCount === 1 ? 'is' : 'are'} {summary.lowStockCount} size variant{summary.lowStockCount > 1 ? 's' : ''} with low stock. 
              Please reorder soon.
            </div>
          </div>
        )}
        
        {/* Out of Stock Alert Banner */}
        {summary.outOfStockCount > 0 && (
          <div className="alert alert-danger mt-3 d-flex align-items-center">
            <FaExclamationTriangle className="me-2" size={20} />
            <div>
              <strong>Out of Stock Alert!</strong> There {summary.outOfStockCount === 1 ? 'is' : 'are'} {summary.outOfStockCount} size variant{summary.outOfStockCount > 1 ? 's' : ''} completely out of stock.
              Please restock immediately.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;