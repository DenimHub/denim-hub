import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
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

function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [summary, setSummary] = useState({
    totalStock: 0,
    lowStockCount: 0,
    totalProducts: 0,
    avgStock: 0
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("Fetching inventory data...");
      
      const productsResponse = await axios.get("http://localhost:8080/api/inventory");
      console.log("Products received:", productsResponse.data);
      
      setProducts(productsResponse.data);
      
      // Calculate summary
      const total = productsResponse.data.reduce((sum, p) => {
        const stock = p.stockQty || 0;
        return sum + stock;
      }, 0);
      
      const lowCount = productsResponse.data.filter(p => {
        const stock = p.stockQty || 0;
        const minStock = p.minStock || 10;
        return stock <= minStock;
      }).length;
      
      setSummary({
        totalStock: total,
        lowStockCount: lowCount,
        totalProducts: productsResponse.data.length,
        avgStock: productsResponse.data.length > 0 ? Math.round(total / productsResponse.data.length) : 0
      });
      
    } catch (err) {
      console.error("Error fetching inventory:", err);
      
      if (err.response) {
        setError(`Server error: ${err.response.status}`);
      } else if (err.request) {
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
    
    // Close export menu when clicking outside
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle edit click
  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditValues({
      stockQty: product.stockQty || 0,
      minStock: product.minStock || 10
    });
  };

  // Handle input change during edit
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  // Save changes
  const handleSave = async (productId) => {
    try {
      await axios.put(`http://localhost:8080/api/inventory/${productId}/stock`, {
        stockQty: editValues.stockQty
      });
      
      await axios.put(`http://localhost:8080/api/inventory/${productId}/min-stock`, {
        minStock: editValues.minStock
      });
      
      await fetchInventory();
      setEditingId(null);
      setEditValues({});
      
    } catch (err) {
      console.error("Error updating inventory:", err);
      alert("Failed to update inventory. Check console for details.");
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  // Get status badge and color
  const getStatusInfo = (stock, minStock) => {
    const stockNum = stock || 0;
    const minStockNum = minStock || 10;
    
    if (stockNum <= 0) {
      return { 
        text: "Out of Stock", 
        badge: "bg-dark",
        color: [100, 100, 100] // RGB for PDF
      };
    } else if (stockNum <= minStockNum) {
      return { 
        text: "Low Stock", 
        badge: "bg-danger",
        color: [220, 53, 69] // Red
      };
    } else if (stockNum <= minStockNum * 2) {
      return { 
        text: "Medium Stock", 
        badge: "bg-warning text-dark",
        color: [255, 193, 7] // Yellow
      };
    } else {
      return { 
        text: "In Stock", 
        badge: "bg-success",
        color: [40, 167, 69] // Green
      };
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("Inventory Report", 14, 20);
      
      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const today = new Date().toLocaleDateString();
      doc.text(`Generated on: ${today}`, 14, 28);
      
      // Add summary
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Products: ${summary.totalProducts}`, 14, 38);
      doc.text(`Total Stock Units: ${summary.totalStock}`, 14, 45);
      doc.text(`Low Stock Items: ${summary.lowStockCount}`, 14, 52);
      doc.text(`Average Stock: ${summary.avgStock}`, 14, 59);
      
      // Prepare table data
      const tableData = products.map((product, index) => {
        const status = getStatusInfo(product.stockQty, product.minStock);
        return [
          index + 1,
          product.name,
          product.category,
          product.size || "-",
          product.stockQty || 0,
          product.minStock || 10,
          status.text
        ];
      });
      
      // Add table
      autoTable(doc, {
        startY: 70,
        head: [['#', 'Product Name', 'Category', 'Size', 'Stock', 'Min Stock', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 35 }
        },
        // Add colors for status column
        didDrawCell: (data) => {
          if (data.column.index === 6 && data.row.index > 0) {
            const status = data.cell.text[0];
            let color = [0, 0, 0];
            
            if (status === "In Stock") color = [40, 167, 69];
            else if (status === "Medium Stock") color = [255, 193, 7];
            else if (status === "Low Stock") color = [220, 53, 69];
            else if (status === "Out of Stock") color = [100, 100, 100];
            
            doc.setTextColor(color[0], color[1], color[2]);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
          }
        }
      });
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Denim Hub Inventory System - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Save PDF
      doc.save(`inventory-report-${today.replace(/\//g, '-')}.pdf`);
      
    } catch (err) {
      console.error("Error exporting to PDF:", err);
      alert("Failed to export PDF. Please try again.");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Prepare data for CSV
      const csvData = products.map(product => ({
        'S.No': products.indexOf(product) + 1,
        'Product Name': product.name,
        'Category': product.category,
        'Size': product.size || '-',
        'Current Stock': product.stockQty || 0,
        'Min Stock': product.minStock || 10,
        'Status': getStatusInfo(product.stockQty, product.minStock).text
      }));
      
      // Add summary at the top
      const summaryData = [
        { 'S.No': '', 'Product Name': 'SUMMARY', 'Category': '', 'Size': '', 'Current Stock': '', 'Min Stock': '', 'Status': '' },
        { 'S.No': '', 'Product Name': `Total Products: ${summary.totalProducts}`, 'Category': '', 'Size': '', 'Current Stock': '', 'Min Stock': '', 'Status': '' },
        { 'S.No': '', 'Product Name': `Total Stock: ${summary.totalStock}`, 'Category': '', 'Size': '', 'Current Stock': '', 'Min Stock': '', 'Status': '' },
        { 'S.No': '', 'Product Name': `Low Stock Items: ${summary.lowStockCount}`, 'Category': '', 'Size': '', 'Current Stock': '', 'Min Stock': '', 'Status': '' },
        { 'S.No': '', 'Product Name': `Average Stock: ${summary.avgStock}`, 'Category': '', 'Size': '', 'Current Stock': '', 'Min Stock': '', 'Status': '' },
        { 'S.No': '', 'Product Name': '', 'Category': '', 'Size': '', 'Current Stock': '', 'Min Stock': '', 'Status': '' },
        { 'S.No': '', 'Product Name': 'DETAILED REPORT', 'Category': '', 'Size': '', 'Current Stock': '', 'Min Stock': '', 'Status': '' },
        { 'S.No': '', 'Product Name': '', 'Category': '', 'Size': '', 'Current Stock': '', 'Min Stock': '', 'Status': '' }
      ];
      
      const finalData = [...summaryData, ...csvData];
      
      // Convert to CSV
      const csv = Papa.unparse(finalData);
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error("Error exporting to CSV:", err);
      alert("Failed to export CSV. Please try again.");
    }
  };

  // Toggle export menu
  const toggleExportMenu = () => {
    setShowExportMenu(!showExportMenu);
  };

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Inventory Management</h3>
          
          <div className="d-flex gap-2">
            {/* Export Button with Dropdown */}
            <div className="position-relative" ref={exportMenuRef}>
              <button 
                className="btn btn-success"
                onClick={toggleExportMenu}
              >
                <FaDownload className="me-2" />
                Export
              </button>
              
              {showExportMenu && (
                <div className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border" style={{ minWidth: "180px", zIndex: 1000 }}>
                  <button 
                    className="btn w-100 text-start px-3 py-2 border-0 bg-transparent hover-bg-light"
                    onClick={() => {
                      exportToPDF();
                      setShowExportMenu(false);
                    }}
                    style={{ borderRadius: 0 }}
                  >
                    <FaFilePdf className="text-danger me-2" />
                    Export as PDF
                  </button>
                  <button 
                    className="btn w-100 text-start px-3 py-2 border-0 bg-transparent hover-bg-light"
                    onClick={() => {
                      exportToCSV();
                      setShowExportMenu(false);
                    }}
                    style={{ borderRadius: 0 }}
                  >
                    <FaFileCsv className="text-success me-2" />
                    Export as CSV
                  </button>
                </div>
              )}
            </div>
            
            {/* Refresh Button */}
            <button 
              className="btn btn-outline-primary"
              onClick={fetchInventory}
              disabled={loading}
            >
              <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} />
              Refresh
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
            <div className="card p-3 shadow-sm border-0 bg-danger bg-opacity-10">
              <FaExclamationTriangle size={28} className="mb-2 text-danger" />
              <h6 className="text-muted">Low Stock Items</h6>
              <h4 className="mb-0">{summary.lowStockCount}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-success bg-opacity-10">
              <FaBoxes size={28} className="mb-2 text-success" />
              <h6 className="text-muted">Total Products</h6>
              <h4 className="mb-0">{summary.totalProducts}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow-sm border-0 bg-info bg-opacity-10">
              <FaBoxes size={28} className="mb-2 text-info" />
              <h6 className="text-muted">Avg Stock/Product</h6>
              <h4 className="mb-0">{summary.avgStock}</h4>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <FaExclamationTriangle className="me-2" size={20} />
            <div className="flex-grow-1">{error}</div>
            <button 
              className="btn btn-sm btn-outline-danger"
              onClick={fetchInventory}
            >
              Retry
            </button>
          </div>
        )}

        {/* Inventory Table */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Stock Details</h5>
            <div className="text-muted small">
              Total: {products.length} items
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
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Size</th>
                      <th style={{ width: "120px" }}>Current Stock</th>
                      <th style={{ width: "100px" }}>Min Stock</th>
                      <th style={{ width: "120px" }}>Status</th>
                      <th style={{ width: "100px" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.length > 0 ? (
                      products.map((product, index) => {
                        const statusInfo = getStatusInfo(product.stockQty, product.minStock);
                        
                        return (
                          <tr key={product.id}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                {product.imageUrl && (
                                  <img 
                                    src={`http://localhost:8080${product.imageUrl}`}
                                    width="30"
                                    height="30"
                                    alt={product.name}
                                    style={{ objectFit: "cover", borderRadius: "4px", marginRight: "8px" }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                )}
                                {product.name}
                              </div>
                            </td>
                            <td>{product.category}</td>
                            <td>{product.size || "-"}</td>
                            <td>
                              {editingId === product.id ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  name="stockQty"
                                  value={editValues.stockQty}
                                  onChange={handleEditChange}
                                  min="0"
                                  style={{ width: "100px" }}
                                />
                              ) : (
                                <span className="fw-bold">{product.stockQty || 0}</span>
                              )}
                            </td>
                            <td>
                              {editingId === product.id ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  name="minStock"
                                  value={editValues.minStock}
                                  onChange={handleEditChange}
                                  min="0"
                                  style={{ width: "80px" }}
                                />
                              ) : (
                                product.minStock || 10
                              )}
                            </td>
                            <td>
                              <span className={`badge ${statusInfo.badge}`}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td>
                              {editingId === product.id ? (
                                <div className="d-flex gap-1">
                                  <button 
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleSave(product.id)}
                                    title="Save"
                                  >
                                    <FaSave size={14} />
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-secondary"
                                    onClick={handleCancel}
                                    title="Cancel"
                                  >
                                    <FaTimes size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEdit(product)}
                                  title="Edit"
                                >
                                  <FaEdit size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          {error ? "Failed to load data" : "No inventory data available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert Section */}
        {!error && summary.lowStockCount > 0 && (
          <div className="alert alert-warning mt-4 d-flex align-items-center">
            <FaExclamationTriangle className="me-2" size={20} />
            <div>
              <strong>Low Stock Alert!</strong> There {summary.lowStockCount === 1 ? 'is' : 'are'} {summary.lowStockCount} product{summary.lowStockCount > 1 ? 's' : ''} with low stock. 
              Please reorder soon.
            </div>
          </div>
        )}
      </div>

      {/* Add this CSS for hover effects */}
      <style jsx>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
}

export default Inventory;