import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Download,
  Car,
  Eye,
  X,
  Upload,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Header } from "@/components";
import { Button } from "@/components/ui/button";
import { Loader } from "../../components";
import { Link } from "react-router-dom";
import ReusableTable from "@/components/ui/ReusableTable";
import { Badge } from "@/components/ui/Badge";
import { dateFormat } from "@/utils/dateFormat";
import { BACKEND_URL } from "@/constants/globalConstants";

const ChallansGenerated: React.FC = () => {
  const [challanData, setChallanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch challan generation records
  const fetchChallanRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use consistent backend URL from constants
      const backendUrl = BACKEND_URL;
      // Use the correct endpoint for generated challans from analyses API
      const apiUrl = `${backendUrl}/api/challan/records?offset=${(currentPage-1)*50}`;

      console.log(
        "🌐 Environment VITE_BACKEND_API_URL:",
        import.meta.env.VITE_BACKEND_API_URL
      );
      console.log("🌐 BACKEND_URL constant:", BACKEND_URL);
      console.log("🌐 Fetching challan records from:", apiUrl);
      console.log("🔍 Full URL breakdown:", {
        backendUrl: backendUrl,
        endpoint: "/api/v1/analyses",
        params: "status=generated&items_per_page=50&page=1",
        fullUrl: apiUrl,
      });

      // Add authentication headers if needed
      const authData = localStorage.getItem("traffic_challan_auth");
      let headers: Record<string, string> = {};

      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const operatorToken = parsed.operatorToken || parsed.appSessionToken;
          if (operatorToken) {
            headers["Authorization"] = `Bearer ${operatorToken}`;
          }
        } catch (error) {
          console.warn(
            "⚠️ Could not parse auth data for challan records fetch"
          );
        }
      }

      console.log("🔐 Request headers:", headers);

      // Test basic connectivity first
      console.log("🔍 Testing basic connectivity to backend...");

      try {
        // First try a simple health check or known endpoint
        const healthCheck = await fetch(`${backendUrl}/health`, {
          method: "GET",
          headers: headers,
        });
        console.log(
          "💓 Health check response:",
          healthCheck.status,
          healthCheck.statusText
        );
      } catch (healthError) {
        console.error("💔 Health check failed:", healthError);
        throw new Error(
          `Cannot connect to backend server at ${backendUrl}. Please verify the server is running and accessible.`
        );
      }

      console.log("📡 Making actual challan records request...");
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });

      console.log("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error response:", errorText);
        console.error(
          "❌ Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        // Check if it's an HTML error page
        if (
          errorText.trim().toLowerCase().startsWith("<!doctype") ||
          errorText.trim().toLowerCase().startsWith("<html")
        ) {
          throw new Error(
            `Backend returned HTML error page (${response.status}). The endpoint may not exist or authentication may be required.`
          );
        }

        throw new Error(
          `Failed to fetch challan records: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Challan records fetched:", data);
      console.log("📊 Response data structure:", {
        hasData: !!data?.data,
        dataLength: data?.data?.length || 0,
        totalRecords: data?.total || data?.count || "unknown",
      });
      setChallanData(data);
    } catch (err: any) {
      console.error("❌ Challan records fetch error:", err);
      console.error("❌ Error name:", err.name);
      console.error("❌ Error message:", err.message);
      console.error("❌ Error stack:", err.stack);

      // Check if it's a network error
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "Network error: Unable to connect to the backend server. Please check if the backend is running and accessible."
        );
      } else if (err.message.includes("Failed to fetch")) {
        setError(
          "Connection failed: Backend server is not responding. Please verify the backend URL and server status."
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallanRecords();
  }, [currentPage]);

  const LeftSideHeader = () => {
    return (
      <div className="flex items-center space-x-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Challans Generated
          </h1>
          <p className="text-sm text-gray-600 font-normal">
            View challan generation status and results
          </p>
        </div>
      </div>
    );
  };

  const RightSideHeader = () => {
    return (
      <div className="flex items-center space-x-3">
        <Button onClick={fetchChallanRecords} variant="outline">
          <Eye /> Refresh
        </Button>
        <Link to="/bulk-upload">
          <Button>
            <Upload /> Upload Photos
          </Button>
        </Link>
      </div>
    );
  };

  // Helper function to get status badge
  const getStatusBadge = (
    status: string,
    challanNumber?: string,
    error?: string
  ) => {
    switch (status) {
      case "generated":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Generated {challanNumber ? `(${challanNumber})` : ""}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "generating":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Generating
          </Badge>
        );
      case "pending":
      case "ready_for_generation":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Initiated
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  // Show loading state
  if (loading) {
    return <Loader />;
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Challans
        </h3>
        <p className="text-gray-500 mb-4">
          {error.includes("Failed to fetch")
            ? "Unable to connect to the backend server. Please check your internet connection and try again."
            : error}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={fetchChallanRecords} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  const columns = [
    {
      accessorKey: "license_plate_number",
      header: "Vehicle Number",
      cell: ({ row }) => (
        <div className="flex gap-3 items-center text-sm">
          <p className="font-medium text-gray-900">
            {row?.original?.license_plate_number ||
              row?.original?.original_license_plate ||
              "N/A"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Queued Time",
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 font-normal">
          {dateFormat(row?.original?.created_at, "datetime")}
        </p>
      ),
    },
    {
      accessorKey: "image_captured_by_name",
      header: "Processed by",
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 font-normal">
          {row?.original?.reviewed_by_officer_name ||
            row?.original?.image_captured_by_name ||
            "System"}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center">
          {getStatusBadge(
            row?.original?.status,
            row?.original?.challan_number,
            row?.original?.challan_generation_error
          )}
        </div>
      ),
    },
    {
      accessorKey: "point_name",
      header: "Location",
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 font-normal truncate max-w-32">
          {row?.original?.point_name || row?.original?.gps_location || "N/A"}
        </p>
      ),
    },
    {
      accessorKey: "vio_data",
      header: "Violations",
      cell: ({ row }) => (
        <div className="space-x-1 flex flex-wrap">
          {(() => {
            let violationCodes = [];

            if (Array.isArray(row?.original?.vio_data)) {
              // New format: array of objects with detected_violation property
              violationCodes = row.original.vio_data
                .map((vio) => vio?.detected_violation || vio)
                .filter((v) => v);
            } else if (
              typeof row?.original?.vio_data === "string" &&
              row.original.vio_data.includes(",")
            ) {
              // Legacy format: comma-separated string (e.g., "1,2,3")
              violationCodes = row.original.vio_data
                .split(",")
                .map((code) => code.trim())
                .filter((code) => code);
            } else if (row?.original?.vio_data) {
              // Single value
              violationCodes = [row.original.vio_data.toString()];
            }

            return violationCodes.length > 0 ? (
              <>
                {violationCodes.slice(0, 2).map((vio, index) => (
                  <Badge key={index} className="text-xs">
                    {typeof vio === "string" ? vio : `V${vio}`}
                  </Badge>
                ))}
                {violationCodes.length > 2 && (
                  <Badge className="text-xs bg-gray-100 text-gray-600">
                    +{violationCodes.length - 2}
                  </Badge>
                )}
              </>
            ) : (
              <Badge className="text-xs">N/A</Badge>
            );
          })()}
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <Header
        LeftSideHeader={<LeftSideHeader />}
        RightSideHeader={<RightSideHeader />}
      />
      <div className="flex flex-col flex-grow m-6">
        <div className="w-full pb-6">
          <h2 className="text-lg flex items-center gap-1.5 text-gray-900 font-semibold">
            Challans Generated{" "}
            <Badge rounded="full" variant="purple">
              {challanData?.totalCount || 0}
            </Badge>
          </h2>
        </div>
        <ReusableTable
          key={currentPage}
          columns={columns}
          data={challanData?.data || []}
          visibleColumns={5}
          currentPage={currentPage}
          itemsPerPage={50}
          onPageChange={(page) => {
            setCurrentPage(page);
          }}
          tableHeight="h-[calc(100vh-174px)]"
          totalRecords={challanData?.totalCount || 0}
        />
      </div>
    </div>
  );
};

export default ChallansGenerated;
