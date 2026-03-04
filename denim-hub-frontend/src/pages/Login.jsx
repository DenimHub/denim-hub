// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        { username, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // Check backend response
      if (response.data.message === "Login successful") {
        // Save role and username
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("username", username);

        // alert("Welcome " + response.data.role);

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setErrorMsg("Invalid Credentials");
      }
    } catch (error) {
      console.error("Login Error:", error.response || error);
      setErrorMsg(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="container-fluid theme-bg-primary min-vh-100 d-flex align-items-center justify-content-center">
      <div className="card p-4 shadow" style={{ width: "360px" }}>
        <h3 className="text-center theme-text-primary mb-4">Login</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <p className="text-danger text-center mb-3">{errorMsg}</p>
          )}

          <button type="submit" className="btn theme-btn-primary w-100 fw-bold">
            Login
          </button>

          <div className="text-end mt-3">
            <Link
              to="/changePassword"
              className="theme-text-primary text-decoration-none fw-semibold"
            >
              Change Password
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;