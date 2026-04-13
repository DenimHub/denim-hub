import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";

function ViewProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8080/api/products/${id}`);
      setProduct(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = () => {
    if (product?.imageUrl) {
      return `http://localhost:8080${product.imageUrl}`;
    }
    return "http://localhost:8080/uploads/products/default.jpg";
  };

  const getTotalStock = () => {
    if (product?.sizes) {
      return product.sizes.reduce((sum, s) => sum + (s.stockQty || 0), 0);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="d-flex vh-100">
        <Sidebar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="d-flex vh-100">
        <Sidebar />
        <div className="flex-grow-1 p-4">
          <div className="alert alert-danger">{error || "Product not found"}</div>
          <button className="btn btn-primary" onClick={() => navigate("/products")}>Back to Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="flex-grow-1 overflow-auto p-4" style={{ background: "#F8F9FA" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Product Details</h3>
          <button className="btn btn-secondary" onClick={() => navigate("/products")}>← Back to Products</button>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 text-center">
                <img src={getImageUrl()} alt={product.name} className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: "300px", objectFit: "contain" }}
                  onError={(e) => e.target.src = "http://localhost:8080/uploads/products/default.jpg"} />
              </div>
              <div className="col-md-8">
                <h3 className="mb-2">{product.name}</h3>
                <p className="text-muted">Category: {product.category}</p>
                
                {product.discountPercent > 0 && (
                  <div className="alert alert-warning d-inline-block mb-3">
                    🔥 {product.discountPercent}% OFF on all sizes!
                  </div>
                )}

                <table className="table table-bordered">
                  <tbody>
                    <tr><th style={{ width: "150px" }}>ID:</th><td>{product.id}</td></tr>
                    <tr><th>Category:</th><td>{product.category}</td></tr>
                    <tr><th>Total Stock:</th><td><span className="fw-bold">{getTotalStock()} units</span></td></tr>
                    <tr><th>Min Stock Alert:</th><td>{product.minStock || 10} units</td></tr>
                  </tbody>
                </table>

                <h5 className="mt-3">Sizes & Pricing</h5>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr><th>Size</th><th>Stock</th><th>Original Price</th><th>Discounted Price</th></tr>
                    </thead>
                    <tbody>
                      {product.sizes?.map(size => {
                        const discountedPrice = size.price * (100 - (product.discountPercent || 0)) / 100;
                        return (
                          <tr key={size.size}>
                            <td><strong>{size.size}</strong></td>
                            <td>{size.stockQty}</td>
                            <td className="text-muted"><del>₹{size.price}</del></td>
                            <td className="text-success fw-bold">
                              ₹{discountedPrice.toFixed(2)}
                              {product.discountPercent > 0 && <small className="text-danger ms-2">(-{product.discountPercent}%)</small>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <h5 className="mt-3">Description</h5>
                <p className="text-muted">{product.description || "No description available"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewProduct;