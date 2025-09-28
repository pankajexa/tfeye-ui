import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./pages/ProtectedRoute";
import Dashboard from "./pages/dashboard";
import ImageIntake from "./pages/upload/ImageIntake";
import PendingForReview from "./pages/pending-review/index";
import LoginScreen from "./pages/login/LoginScreen";
import NotFound from "./pages/not-found/NotFound";
import ChallansRejected from "./pages/challans-rejected";
import ChallansGenerated from "./pages/challans-generated";
import BulkImageUpload from "./pages/bulk-upload";
import RejectedChallanDetails from "./pages/challans-rejected/rejected-challan-details";
import PendingChallan from "./pages/pending-review/challan-details";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "upload", element: <ImageIntake /> },
      { path: "pending-review", element: <PendingForReview /> },
      { path: "pending-review/:id", element: <PendingChallan /> },
      { path: "challans-generated", element: <ChallansGenerated /> },
      { path: "challans-rejected", element: <ChallansRejected /> },
       { path: "challans-rejected/:id", element: <RejectedChallanDetails /> },
      { path: "bulk-upload", element: <BulkImageUpload /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
