import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-purple-500 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">
        Oops! The page you’re looking for doesn’t exist.
      </p>
      <Link
        to="/dashboard"
        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition"
      >
        Go back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
