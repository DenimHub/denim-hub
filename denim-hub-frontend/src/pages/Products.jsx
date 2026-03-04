import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FaSearch, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");

  // Fetch products from database - use useCallback to prevent recreation
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/products");
      setProducts(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - only created once

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Only runs when fetchProducts changes (which it doesn't)

  // --- Delete Product ---
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

 const confirmDelete = async () => {
  try {
    console.log("Attempting to delete product with ID:", deleteId);
    
    const response = await axios.delete(`http://localhost:8080/api/products/${deleteId}`);
    
    console.log("Delete response:", response.data);
    
    // Update local state immediately - NO RELOAD
    setProducts(prevProducts => prevProducts.filter((p) => p.id !== deleteId));
    setShowDeleteModal(false);
    setDeleteId(null);
    
    // Show success message (optional)
    alert("Product deleted successfully!");
    
  } catch (err) {
    console.error("Error deleting product:", err);
    
    // Log detailed error information
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error response data:", err.response.data);
      console.error("Error response status:", err.response.status);
      console.error("Error response headers:", err.response.headers);
      
      // Show specific error message from server if available
      const errorMessage = err.response.data?.error || err.response.data?.message || "Failed to delete product";
      alert(`Error: ${errorMessage}`);
      
    } else if (err.request) {
      // The request was made but no response was received
      console.error("Error request:", err.request);
      alert("No response from server. Please check if backend is running.");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", err.message);
      alert(`Error: ${err.message}`);
    }
  }
};
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // --- Edit Product ---
  const handleEditClick = (product) => {
    setEditProduct({ ...product });
    setImageFile(null);
    // Set image preview from existing image
    if (product.imageUrl) {
      setImagePreview(`http://localhost:8080${product.imageUrl}`);
    } else {
      setImagePreview(null);
    }
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const saveEdit = async () => {
    try {
      const formData = new FormData();
      formData.append("name", editProduct.name);
      formData.append("category", editProduct.category);
      formData.append("size", editProduct.size || "");
      formData.append("price", editProduct.price);
      formData.append("stockQty", editProduct.stockQty);
      formData.append("description", editProduct.description || "");
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await axios.put(
        `http://localhost:8080/api/products/${editProduct.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update local state with updated product - NO RELOAD
      setProducts(prevProducts =>
        prevProducts.map((p) => (p.id === editProduct.id ? response.data : p))
      );

      // Clean up
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setShowEditModal(false);
      setEditProduct(null);
      setImagePreview(null);
      setImageFile(null);
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product. Please try again.");
    }
  };

  const cancelEdit = () => {
    // Clean up blob URL if exists
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setShowEditModal(false);
    setEditProduct(null);
    setImagePreview(null);
    setImageFile(null);
  };

  // --- View Product ---
  const handleViewClick = (id) => {
    navigate(`/products/view/${id}`);
  };

  // --- Filter & Sort Products (memoized) ---
  const filteredProducts = products
    .filter(
      (p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "name") return a.name?.localeCompare(b.name);
      if (sortOption === "category") return a.category?.localeCompare(b.category);
      if (sortOption === "price") return a.price - b.price;
      if (sortOption === "stock") return a.stockQty - b.stockQty;
      return 0;
    });
// Get image URL with fallback
const getImageUrl = (product) => {
  if (product.imageUrl) {
    // If imageUrl already starts with http, use as is
    if (product.imageUrl.startsWith('http')) {
      return product.imageUrl;
    }
    // If it starts with /uploads, use full URL
    if (product.imageUrl.startsWith('/uploads')) {
      return `http://localhost:8080${product.imageUrl}`;
    }
    // Otherwise assume it's just filename
    return `http://localhost:8080/uploads/products/${product.imageUrl}`;
  }
  return `http://localhost:8080/uploads/products/default.jpg`;
};
  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Products</h3>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/products/add")}
          >
            + Add Product
          </button>
        </div>

        {/* Search & Sort */}
        <div className="d-flex gap-3 mb-3">
          <div className="input-group" style={{ maxWidth: "400px" }}>
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ maxWidth: "220px" }}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="">Sort By</option>
            <option value="name">Name (A–Z)</option>
            <option value="category">Category (A–Z)</option>
            <option value="price">Price (Low → High)</option>
            <option value="stock">Stock (Low → High)</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchProducts}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          /* Products Table */
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "80px" }}>Image</th>
                    <th style={{ width: "60px" }}>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th style={{ width: "70px" }}>Size</th>
                    <th style={{ width: "100px" }}>Price (₹)</th>
                    <th>Description</th>
                    <th style={{ width: "80px" }}>Stock</th>
                    <th style={{ width: "120px" }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
  <img
    src={getImageUrl(product)}
    width="50"
    height="50"
    alt={product.name}
    style={{ objectFit: "cover", borderRadius: "4px" }}
    onError={(e) => {
      e.target.onerror = null; // Prevent infinite loop
      e.target.src = "http://localhost:8080/uploads/products/default.jpg";
    }}
  />
</td>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.size || "-"}</td>
                        <td>₹{product.price}</td>
                        <td>
                          <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {product.description || "-"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`fw-bold ${
                              product.stockQty <= 5 ? "text-danger" : "text-success"
                            }`}
                          >
                            {product.stockQty}
                          </span>
                        </td>
                        <td className="text-center">
                          <FaEye
                            className="text-primary me-2"
                            style={{ cursor: "pointer", fontSize: "18px" }}
                            onClick={() => handleViewClick(product.id)}
                            title="View"
                          />
                          <FaEdit
                            className="text-warning me-2"
                            style={{ cursor: "pointer", fontSize: "18px" }}
                            onClick={() => handleEditClick(product)}
                            title="Edit"
                          />
                          <FaTrash
                            className="text-danger"
                            style={{ cursor: "pointer", fontSize: "18px" }}
                            onClick={() => handleDeleteClick(product.id)}
                            title="Delete"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        {searchTerm ? "No products match your search" : "No products found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- Edit Modal --- */}
      {showEditModal && editProduct && (
        <>
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Product</h5>
                  <button type="button" className="btn-close" onClick={cancelEdit}></button>
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={editProduct.name || ""}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Category</label>
                      <input
                        type="text"
                        className="form-control"
                        name="category"
                        value={editProduct.category || ""}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Size</label>
                      <input
                        type="text"
                        className="form-control"
                        name="size"
                        value={editProduct.size || ""}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Price (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        value={editProduct.price || ""}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        name="stockQty"
                        value={editProduct.stockQty || ""}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        value={editProduct.description || ""}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Product Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <small className="text-muted">Leave empty to keep current image</small>
                    </div>

                    {imagePreview && (
                      <div className="col-12 text-center">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            marginTop: "10px",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={saveEdit}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- Delete Modal --- */}
      {showDeleteModal && (
        <>
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button type="button" className="btn-close" onClick={cancelDelete}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this product?</p>
                  <p className="text-danger mb-0">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={cancelDelete}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Products;