import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";

function AddProduct() {
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    category: "",
    size: "",
    price: "",
    stockQty: "",
     minStock: "10",
    description: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Handle input changes ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  // --- Handle image selection ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Clean up previous preview if exists
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // --- Submit product to backend ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!product.name || !product.category || !product.price || !product.stockQty) {
      alert("Please fill all required fields");
      return;
    }

    if (!imageFile) {
      alert("Please select a product image");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("category", product.category);
      formData.append("size", product.size || "");
      formData.append("price", product.price);
      formData.append("stockQty", product.stockQty);
      formData.append("minStock", product.minStock);
      formData.append("description", product.description || "");
      formData.append("image", imageFile);

      await axios.post(
        "http://localhost:8080/api/products/with-image",
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data" 
          } 
        }
      );

      // Clean up preview
      URL.revokeObjectURL(imagePreview);
      
      alert("Product Added Successfully!");
      navigate("/products"); // Navigate without reloading
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clean up on unmount
  const handleCancel = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    navigate("/products");
  };

  return (
    <div className="d-flex vh-100">
      <Sidebar />

      <div className="flex-grow-1 overflow-auto">
        <div className="container py-4">
          <h3 className="mb-4">Add Product</h3>

          <div className="card shadow-sm mx-auto" style={{ maxWidth: "900px" }}>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Name */}
                  <div className="col-md-6">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={product.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="col-md-6">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="category"
                      value={product.category}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Size */}
                  <div className="col-md-4">
                    <label className="form-label">Size</label>
                    <input
                      type="text"
                      className="form-control"
                      name="size"
                      value={product.size}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Price */}
                  <div className="col-md-4">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={product.price}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Stock */}
                  <div className="col-md-4">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="stockQty"
                      value={product.stockQty}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
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
                      <small className="text-muted">Alert when stock falls below this</small>
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
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginTop: "10px",
                        }}
                      />
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="col-12 text-end mt-3">
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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