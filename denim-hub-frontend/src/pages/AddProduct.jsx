import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function AddProduct() {
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    category: "",
    size: "",
    price: "",
    stock: "",
    description: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setProduct({ ...product, image: previewUrl });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!product.name || !product.category || !product.price || !product.stock) {
      alert("Please fill all required fields");
      return;
    }

    console.log(product);
    alert("Product Added Successfully");
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

                  <div className="col-md-6">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={product.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="category"
                      value={product.category}
                      onChange={handleChange}
                    />
                  </div>

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

                  <div className="col-md-4">
                    <label className="form-label">Price *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={product.price}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="stock"
                      value={product.stock}
                      onChange={handleChange}
                    />
                  </div>

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

                  <div className="col-12">
                    <label className="form-label">Product Image</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
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

                  <div className="col-12 text-end mt-3">
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => navigate("/products")}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="btn btn-primary">
                      Save Product
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
