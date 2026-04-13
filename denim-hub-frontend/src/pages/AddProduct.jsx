import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useToast } from "../context/ToastContext";

function AddProduct() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    category: "",
    description: "",
    minStock: "10",
    discountPercent: "0",
  });

  const [sizes, setSizes] = useState([
    { size: "S", stockQty: "", price: "" },
    { size: "M", stockQty: "", price: "" },
    { size: "L", stockQty: "", price: "" },
    { size: "XL", stockQty: "", price: "" },
    { size: "XXL", stockQty: "", price: "" }
  ]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    if (name === "name") {
      setNameError("");
      checkProductName(value);
    }
  };

  const handleSizeChange = (index, field, value) => {
    const updatedSizes = [...sizes];
    updatedSizes[index][field] = value;
    setSizes(updatedSizes);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const checkProductName = async (name) => {
    if (!name.trim()) return;
    try {
      const response = await axios.get(`http://localhost:8080/api/products/check-name?name=${encodeURIComponent(name)}`);
      if (response.data.exists) {
        setNameError("❌ Product with this name already exists!");
        return true;
      }
      setNameError("");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleNameBlur = async () => {
    await checkProductName(product.name);
  };

  const handleNameChange = async (e) => {
    const value = e.target.value;
    setProduct(prev => ({ ...prev, name: value }));
    
    if (value.length > 2) {
      try {
        const response = await axios.get(`http://localhost:8080/api/products/suggest?q=${encodeURIComponent(value)}`);
        setSuggestions(response.data);
      } catch (err) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name.trim()) {
       showToast("❌ Please enter product name", "warning");
      return;
    }

    const nameExists = await checkProductName(product.name);
   if (nameExists) {
      showToast(`❌ Product "${product.name}" already exists! Try a different name.`, "error");
      return;
    }

    if (!product.category) {
      showToast("❌ Please select category", "warning");
      return;
    }

     if (!imageFile) {
      showToast("❌ Please select a product image", "warning");
      return;
    }

    const hasValidSize = sizes.some(size => size.stockQty && size.price && size.stockQty > 0);
     if (!hasValidSize) {
      showToast("❌ Please add at least one size with stock quantity and price", "warning");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("category", product.category);
      formData.append("description", product.description || "");
      formData.append("minStock", product.minStock);
      formData.append("discountPercent", product.discountPercent);
      formData.append("image", imageFile);
      
      const sizesData = sizes
        .filter(size => size.stockQty && size.price && size.stockQty > 0)
        .map(size => ({
          size: size.size,
          stockQty: parseInt(size.stockQty),
          price: parseFloat(size.price)
        }));
      
      formData.append("sizes", JSON.stringify(sizesData));

      await axios.post("http://localhost:8080/api/products/with-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      URL.revokeObjectURL(imagePreview);
  showToast("✅ Product added successfully!", "success");
      navigate("/products");
      
    } catch (err) {
      console.error("Error adding product:", err);
      if (err.response?.status === 409) {
        showToast(`❌ ${err.response.data?.error || "Product with this name already exists!"}`, "error");
      } else {
         showToast("❌ Failed to add product. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    navigate("/products");
  };

  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="flex-grow-1 overflow-auto">
        <div className="container py-4">
          <h3 className="mb-4">Add Product</h3>

          <div className="card shadow-sm mx-auto" style={{ maxWidth: "1000px" }}>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Name with suggestions */}
                  <div className="col-md-12">
                    <label className="form-label">Product Name *</label>
                    <input
                      type="text"
                      className={`form-control ${nameError ? 'is-invalid' : ''}`}
                      name="name"
                      value={product.name}
                      onChange={handleNameChange}
                      onBlur={handleNameBlur}
                      required
                      placeholder="e.g., Classic Blue Denim Jeans"
                    />
                    {nameError && <div className="invalid-feedback">{nameError}</div>}
                    {suggestions.length > 0 && (
                      <div className="list-group mt-1">
                        {suggestions.map(s => (
                          <button
                            key={s}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onClick={() => {
                              setProduct(prev => ({ ...prev, name: s }));
                              setSuggestions([]);
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="col-md-6">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      name="category"
                      value={product.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Jeans">Jeans</option>
                      <option value="Denim Shirts">Denim Shirts</option>
                      <option value="Jackets">Jackets</option>
                      <option value="Shorts">Shorts</option>
                      <option value="Skirts">Skirts</option>
                      <option value="Dresses">Dresses</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>

                  {/* Discount Percent */}
                  <div className="col-md-6">
                    <label className="form-label">Discount (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="discountPercent"
                      value={product.discountPercent}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="1"
                    />
                    <small className="text-muted">Products with &gt;50% discount won't get additional bill discount</small>
                  </div>

                  {/* Min Stock Alert */}
                  <div className="col-md-6">
                    <label className="form-label">Min Stock Alert *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="minStock"
                      value={product.minStock}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                    <small className="text-muted">Alert when total stock falls below this</small>
                  </div>

                  {/* Size Table */}
                  <div className="col-12">
                    <label className="form-label fw-bold">Sizes & Stock Details *</label>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Size</th>
                            <th>Stock Quantity</th>
                            <th>Price (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sizes.map((size, index) => (
                            <tr key={size.size}>
                              <td className="align-middle"><strong>{size.size}</strong></td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Stock"
                                  value={size.stockQty}
                                  onChange={(e) => handleSizeChange(index, 'stockQty', e.target.value)}
                                  min="0"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Price"
                                  value={size.price}
                                  onChange={(e) => handleSizeChange(index, 'price', e.target.value)}
                                  min="0"
                                  step="1"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <small className="text-muted">Fill at least one size with stock and price</small>
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="description"
                      value={product.description}
                      onChange={handleChange}
                      placeholder="Product description, features, material, etc."
                    />
                  </div>

                  {/* Image */}
                  <div className="col-12">
                    <label className="form-label">Product Image *</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageChange}
                      required
                    />
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="col-12 text-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginTop: "10px",
                        }}
                      />
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="col-12 text-end mt-3">
                    <button type="button" className="btn btn-secondary me-2" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        "Save Product"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;