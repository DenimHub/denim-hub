import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FaSearch, FaEye, FaEdit, FaTrash, FaTag, FaPercent } from "react-icons/fa";
import axios from "axios";
import { useDarkMode } from "../context/DarkModeContext";

function Products() {
    const { darkMode } = useDarkMode();
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
  const [sizes, setSizes] = useState([
    { size: "S", stockQty: "", price: "" },
    { size: "M", stockQty: "", price: "" },
    { size: "L", stockQty: "", price: "" },
    { size: "XL", stockQty: "", price: "" },
    { size: "XXL", stockQty: "", price: "" }
  ]);

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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/products/${deleteId}`);
      setProducts(prevProducts => prevProducts.filter((p) => p.id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      alert("✅ Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleEditClick = (product) => {
    setEditProduct({ ...product });
    setImageFile(null);
    
    if (product.imageUrl) {
      setImagePreview(`http://localhost:8080${product.imageUrl}`);
    } else {
      setImagePreview(null);
    }
    
    if (product.sizes && product.sizes.length > 0) {
      const existingSizes = sizes.map(size => {
        const foundSize = product.sizes.find(s => s.size === size.size);
        return {
          size: size.size,
          stockQty: foundSize ? foundSize.stockQty : "",
          price: foundSize ? foundSize.price : ""
        };
      });
      setSizes(existingSizes);
    }
    
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (index, field, value) => {
    const updatedSizes = [...sizes];
    updatedSizes[index][field] = value;
    setSizes(updatedSizes);
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
      const sizesData = sizes
        .filter(size => size.stockQty && size.price && size.stockQty > 0)
        .map(size => ({
          size: size.size,
          stockQty: parseInt(size.stockQty),
          price: parseFloat(size.price)
        }));

      const formData = new FormData();
      formData.append("name", editProduct.name);
      formData.append("category", editProduct.category);
      formData.append("description", editProduct.description || "");
      formData.append("minStock", editProduct.minStock || 10);
      formData.append("discountPercent", editProduct.discountPercent || 0);
      formData.append("sizes", JSON.stringify(sizesData));
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await axios.put(
        `http://localhost:8080/api/products/${editProduct.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setProducts(prevProducts =>
        prevProducts.map((p) => (p.id === editProduct.id ? response.data : p))
      );

      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setShowEditModal(false);
      setEditProduct(null);
      setImagePreview(null);
      setImageFile(null);
      alert("✅ Product updated successfully!");
      
    } catch (err) {
      console.error("Error updating product:", err);
      if (err.response?.status === 409) {
        alert(err.response.data?.error || "Product with this name already exists!");
      } else {
        alert("Failed to update product. Please try again.");
      }
    }
  };

  const cancelEdit = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setShowEditModal(false);
    setEditProduct(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleViewClick = (id) => {
    navigate(`/products/view/${id}`);
  };

  const filteredProducts = products
    .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === "name") return a.name?.localeCompare(b.name);
      if (sortOption === "category") return a.category?.localeCompare(b.category);
      if (sortOption === "price") {
        const priceA = a.sizes?.length > 0 ? Math.min(...a.sizes.map(s => s.price)) : a.price;
        const priceB = b.sizes?.length > 0 ? Math.min(...b.sizes.map(s => s.price)) : b.price;
        return priceA - priceB;
      }
      if (sortOption === "stock") {
        const stockA = a.sizes?.reduce((sum, s) => sum + (s.stockQty || 0), 0) || 0;
        const stockB = b.sizes?.reduce((sum, s) => sum + (s.stockQty || 0), 0) || 0;
        return stockA - stockB;
      }
      return 0;
    });

  const getImageUrl = (product) => {
    if (product.imageUrl) {
      if (product.imageUrl.startsWith('http')) return product.imageUrl;
      if (product.imageUrl.startsWith('/uploads')) return `http://localhost:8080${product.imageUrl}`;
      return `http://localhost:8080/uploads/products/${product.imageUrl}`;
    }
    return `http://localhost:8080/uploads/products/default.jpg`;
  };

  const getTotalStock = (product) => {
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes.reduce((sum, size) => sum + (size.stockQty || 0), 0);
    }
    return product.stockQty || 0;
  };

  const getMinPrice = (product) => {
    if (product.sizes && product.sizes.length > 0) {
      return Math.min(...product.sizes.map(s => s.price));
    }
    return product.price;
  };

  const getSizesDisplay = (product) => {
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes
        .filter(s => s.stockQty > 0)
        .map(s => `${s.size}:${s.stockQty}`)
        .join(', ');
    }
    return `${product.size || '-'}:${product.stockQty || 0}`;
  };

  return (
    <div className={`d-flex vh-100 overflow-hidden ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar />
       <div className={`flex-grow-1 p-4 overflow-auto ${darkMode ? 'dark-mode' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">🛍️ Products</h3>
          <button className="btn btn-primary" onClick={() => navigate("/products/add")}>
            + Add Product
          </button>
        </div>

        <div className="d-flex gap-3 mb-3">
          <div className="input-group" style={{ maxWidth: "400px" }}>
            <span className="input-group-text"><FaSearch /></span>
            <input type="text" className="form-control" placeholder="Search by name or category"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="form-select" style={{ maxWidth: "220px" }} value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}>
            <option value="">Sort By</option>
            <option value="name">Name (A–Z)</option>
            <option value="category">Category (A–Z)</option>
            <option value="price">Price (Low → High)</option>
            <option value="stock">Stock (Low → High)</option>
          </select>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
            <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchProducts}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : (
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Image</th><th>ID</th><th>Name</th><th>Category</th><th>Sizes (Size:Stock)</th>
                      <th>Price (₹)</th><th>Discount</th><th>Description</th><th>Total Stock</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td><img src={getImageUrl(product)} width="50" height="50" style={{ objectFit: "cover", borderRadius: "4px" }}
                            onError={(e) => e.target.src = "http://localhost:8080/uploads/products/default.jpg"} /></td>
                          <td>{product.id}</td>
                          <td><strong>{product.name}</strong>{product.discountPercent > 0 && <span className="badge bg-danger ms-2">-{product.discountPercent}%</span>}</td>
                          <td>{product.category}</td>
                          <td><small className="text-muted">{getSizesDisplay(product)}</small></td>
                          <td>
                            {product.discountPercent > 0 && product.discountPercent <= 50 ? (
                              <>
                                <span className="text-muted text-decoration-line-through">₹{getMinPrice(product)}</span>
                                <span className="text-success fw-bold ms-1">
                                  ₹{(getMinPrice(product) * (100 - product.discountPercent) / 100).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span>₹{getMinPrice(product)}</span>
                            )}
                          </td>
                          <td>
                            {product.discountPercent > 0 ? (
                              <span className="badge bg-warning text-dark">
                                <FaPercent className="me-1" />{product.discountPercent}% OFF
                              </span>
                            ) : (
                              <span className="text-muted">No discount</span>
                            )}
                          </td>
                          <td><div style={{ maxWidth: "180px" }} className="text-truncate">{product.description || "-"}</div></td>
                          <td>
                            <span className={`fw-bold ${getTotalStock(product) <= (product.minStock || 10) ? "text-danger" : "text-success"}`}>
                              {getTotalStock(product)}
                            </span>
                          </td>
                          <td>
                            <FaEye className="text-primary me-2" style={{ cursor: "pointer" }} onClick={() => handleViewClick(product.id)} title="View" />
                            <FaEdit className="text-warning me-2" style={{ cursor: "pointer" }} onClick={() => handleEditClick(product)} title="Edit" />
                            <FaTrash className="text-danger" style={{ cursor: "pointer" }} onClick={() => handleDeleteClick(product.id)} title="Delete" />
                           </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="10" className="text-center py-4">{searchTerm ? "No products match your search" : "No products found"}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editProduct && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">✏️ Edit Product - {editProduct.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={cancelEdit}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label">Product Name</label>
                    <input type="text" className="form-control" name="name" value={editProduct.name || ""} onChange={handleEditChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select className="form-select" name="category" value={editProduct.category || ""} onChange={handleEditChange}>
                      <option value="">Select Category</option>
                      <option value="Jeans">Jeans</option><option value="Denim Shirts">Denim Shirts</option>
                      <option value="Jackets">Jackets</option><option value="Shorts">Shorts</option>
                      <option value="Skirts">Skirts</option><option value="Dresses">Dresses</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Discount (%)</label>
                    <input type="number" className="form-control" name="discountPercent" value={editProduct.discountPercent || 0}
                      onChange={handleEditChange} min="0" max="100" step="1" />
                    <small className="text-muted">Products with &gt;50% discount won't get additional bill discount</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Min Stock Alert</label>
                    <input type="number" className="form-control" name="minStock" value={editProduct.minStock || 10} onChange={handleEditChange} min="0" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold">Sizes & Stock Details</label>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead className="table-light"><tr><th>Size</th><th>Stock Quantity</th><th>Price (₹)</th></tr></thead>
                        <tbody>
                          {sizes.map((size, index) => (
                            <tr key={size.size}>
                              <td className="align-middle"><strong>{size.size}</strong></td>
                              <td><input type="number" className="form-control" placeholder="Stock" value={size.stockQty}
                                onChange={(e) => handleSizeChange(index, 'stockQty', e.target.value)} min="0" /></td>
                              <td><input type="number" className="form-control" placeholder="Price" value={size.price}
                                onChange={(e) => handleSizeChange(index, 'price', e.target.value)} min="0" step="1" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <small className="text-muted">Fill at least one size with stock and price</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" name="description" rows="3" value={editProduct.description || ""} onChange={handleEditChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Product Image</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                    <small className="text-muted">Leave empty to keep current image</small>
                  </div>
                  {imagePreview && (
                    <div className="col-12 text-center">
                      <img src={imagePreview} alt="Preview" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px" }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close btn-close-white" onClick={cancelDelete}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this product?</p>
                <p className="text-danger mb-0">⚠️ This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={cancelDelete}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;