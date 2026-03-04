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

  if (loading) {
    return (
      <div className="d-flex vh-100">
        <Sidebar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
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
          <button className="btn btn-primary" onClick={() => navigate("/products")}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="flex-grow-1 overflow-auto p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Product Details</h3>
          <button className="btn btn-secondary" onClick={() => navigate("/products")}>
            Back to Products
          </button>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 text-center mb-3">
                <img
                  src={getImageUrl()}
                  alt={product.name}
                  className="img-fluid rounded"
                  style={{ maxHeight: "300px", objectFit: "contain" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "http://localhost:8080/uploads/products/default.jpg";
                  }}
                />
              </div>
              <div className="col-md-8">
                <h4 className="mb-3">{product.name}</h4>
                <table className="table">
                  <tbody>
                    <tr>
                      <th style={{ width: "150px" }}>ID:</th>
                      <td>{product.id}</td>
                    </tr>
                    <tr>
                      <th>Category:</th>
                      <td>{product.category}</td>
                    </tr>
                    <tr>
                      <th>Size:</th>
                      <td>{product.size || "-"}</td>
                    </tr>
                    <tr>
                      <th>Price:</th>
                      <td>₹{product.price}</td>
                    </tr>
                    <tr>
                      <th>Stock:</th>
                      <td>
                        <span className={`fw-bold ${product.stockQty <= 5 ? "text-danger" : "text-success"}`}>
                          {product.stockQty}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>Description:</th>
                      <td>{product.description || "No description available"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewProduct;