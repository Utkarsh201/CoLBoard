import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { CanvasContext } from "../store/CanvasHistory";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(CanvasContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
