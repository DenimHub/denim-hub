import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "./context/ToastContext";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { DarkModeProvider } from "./context/DarkModeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <DarkModeProvider>
    <App />
    </DarkModeProvider>
    </ToastProvider>
  </StrictMode>
);
