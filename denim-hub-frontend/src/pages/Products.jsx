import Sidebar from "../components/Sidebar";
import { FaSearch, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const productsData = [
  {
    id: 101,
    name: "Blue Denim Jeans",
    category: "Jeans",
    size: "32",
    price: 1999,
    description: "Slim fit blue denim jeans",
    stock: 12,
    image: "/products/jeans1.jpg",
  },
  {
    id: 102,
    name: "Slim Fit Shirt",
    category: "Shirt",
    size: "M",
    price: 1499,
    description: "Cotton slim fit shirt",
    stock: 6,
    image: "/products/shirt1.jpg",
  },
];

function Products() {
  const [products, setProducts] = useState(productsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate();

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setProducts(products.filter((p) => p.id !== deleteId));
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleEditClick = (product) => {
    setEditProduct({ ...product });
    setImagePreview(product.image);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProduct({ ...editProduct, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
    setEditProduct({
      ...editProduct,
      image: previewUrl,
    });
  };

  const saveEdit = () => {
    setProducts(
      products.map((p) => (p.id === editProduct.id ? editProduct : p)),
    );
    setShowEditModal(false);
    setEditProduct(null);
    setImagePreview(null);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditProduct(null);
    setImagePreview(null);
  };

  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortOption === "name") return a.name.localeCompare(b.name);
      if (sortOption === "category")
        return a.category.localeCompare(b.category);
      if (sortOption === "price") return a.price - b.price;
      if (sortOption === "stock") return a.stock - b.stock;
      return 0;
    });

  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Products</h3>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/products/add")}
          >
            + Add Product
          </button>
        </div>

        <div className="d-flex gap-3 mb-3">
          <div className="input-group">
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

        <div className="card shadow-sm">
          <div className="card-body p-0">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Image</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Price (₹)</th>
                  <th>Description</th>
                  <th>Stock</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img
                        src={product.image}
                        width="50"
                        height="50"
                        alt={product.name}
                        style={{ objectFit: "cover" }}
                      />
                    </td>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.size}</td>
                    <td>{product.price}</td>
                    <td>{product.description}</td>
                    <td>
                      <span
                        className={`fw-bold ${
                          product.stock <= 5 ? "text-danger" : "text-success"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="text-center">
                      <FaEye
                        className="text-primary me-3 cursor-pointer"
                        onClick={() => navigate(`/products/view/${product.id}`)}
                      />
                      <FaEdit
                        className="text-warning me-3 cursor-pointer"
                        onClick={() => handleEditClick(product)}
                      />
                      <FaTrash
                        className="text-danger cursor-pointer"
                        onClick={() => handleDeleteClick(product.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showEditModal && editProduct && (
        <>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Edit Product</h5>
                  <button className="btn-close" onClick={cancelEdit}></button>
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label>Name</label>
                      <input
                        className="form-control"
                        name="name"
                        value={editProduct.name}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label>Category</label>
                      <input
                        className="form-control"
                        name="category"
                        value={editProduct.category}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label>Size</label>
                      <input
                        className="form-control"
                        name="size"
                        value={editProduct.size}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label>Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        value={editProduct.price}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label>Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        name="stock"
                        value={editProduct.stock}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-12">
                      <label>Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={editProduct.description}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="col-12">
                      <label>Product Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>

                    <div className="col-12 text-center">
                      {imagePreview && (
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
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveEdit}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {showDeleteModal && (
        <>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Confirm Delete</h5>
                  <button className="btn-close" onClick={cancelDelete}></button>
                </div>
                <div className="modal-body">
                  Are you sure you want to delete this product?
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={cancelDelete}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={confirmDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}

export default Products;
