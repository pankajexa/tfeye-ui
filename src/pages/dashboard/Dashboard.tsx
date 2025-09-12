import { useState, useEffect } from "react";
import {
  Camera,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { Loader, ErrorComponent } from "../../components";
import { Header } from "../../components";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { dateFormat } from "@/utils/dateFormat";

export interface StatusCardProps {
  icon: any;
  label: string;
  value: string | number;
}
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_API_URL || "https://trafficeye.onrender.com";
const Dashboard: React.FC = () => {
  const { currentOfficer } = useAuth();

  const [analysisSummary, setAnalysisSummary] = useState(null); // holds API response
  const [loading, setLoading] = useState(false); // loader
  const [error, setError] = useState(""); // error handling

  const fetchAnalysisSummary = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/analysis-results/summary?limit=500&offset=0`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisSummary(data);
    } catch (err) {
      setError("Failed to fetch analysis summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisSummary();
  }, []);

  // Show loading state
  if (loading) {
    return <Loader />;
  }

  const StatusCard = ({ icon: Icon, label, value }: StatusCardProps) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-gray-700 flex items-center justify-center shadow border rounded-lg">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-md font-semibold text-gray-500">{label}</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  const LeftSideHeader = () => {
    return (
      <div className="flex items-center space-x-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {currentOfficer?.id || ""}
          </h1>
          <p className="text-sm text-gray-600 font-normal">
            Track, review, and manage all traffic violation images efficiently.
          </p>
        </div>
      </div>
    );
  };
  const RightSideHeader = () => {
    return (
      <div className="flex items-center space-x-3">
        <Link to="/bulk-upload">
          <Button>
            <Upload /> Upload Photos
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col h-screen">
      <Header
        LeftSideHeader={<LeftSideHeader />}
        RightSideHeader={<RightSideHeader />}
      />
      <div className="p-6 flex-grow flex flex-col space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Photos Captured */}

          <StatusCard
            icon={Camera}
            label="Photos Captured"
            value={analysisSummary?.total_photos_captured ?? 0}
          />
          <StatusCard
            icon={Clock}
            label="In  Process"
            value={analysisSummary?.in_process || 0}
          />
          <StatusCard
            icon={CheckCircle}
            label="Pending for Review"
            value={analysisSummary?.pending_review || 0}
          />

          <StatusCard
            icon={AlertTriangle}
            label="e-Challan Generated"
            value={analysisSummary?.challan_generated || 0}
          />
          {/* <StatusCard
            icon={AlertTriangle}
            label="Rejected"
            value={analysisSummary?.challan_rejected || 0}
          /> */}
        </div>

        {/* Violations Section */}
        <div className="bg-white rounded-lg flex-grow shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Store traffic
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photos Captured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In AI Process
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending for Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    e-Challan Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rejected
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysisSummary?.data?.length > 0 ? (
                  analysisSummary?.data?.map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row?.date
                          ? dateFormat(new Date(row.date), "date")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {row?.total_photos_captured}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {row?.in_process}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {row?.pending_review}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {row?.challan_generated}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {row?.challan_rejected}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-sm">No data available</p>
                        <p className="text-xs mt-1">
                          Start by uploading traffic images to see statistics
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* <DashboardCharts /> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
