import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Header, Navbar } from "../components/index";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex w-full  h-screen bg-gray-50">
      <Navbar pathname={location?.pathname} />
      <main key={location.pathname} className="w-full h-full overflow-scroll">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;
