import React, { useState, useEffect } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { useChallanContext } from "@/context/ChallanContext";
import ImageZoom from "@/components/ImageDetails/ImageZoom";
import { apiService } from "@/services/api";
import { RejectedSubTab } from "@/types";
import { Header } from "@/components";
import { Button } from "@/components/ui/button";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Loader } from "../../components";
import { Link } from "react-router-dom";

interface RejectedTabProps {
  activeSubTab?: RejectedSubTab;
}

const rejectedSubTabs = [
  { id: "system-rejected" as RejectedSubTab, label: "System Rejected" },
  { id: "operator-rejected" as RejectedSubTab, label: "Operator Rejected" },
  { id: "rta-mismatch" as RejectedSubTab, label: "RTA Mismatch" },
];

const ChallansRejected: React.FC<RejectedTabProps> = ({
}) => {
  const { data, loading, error } = useAnalyses("rejected", 50, 0);
  const [rejectedChallans, setRejectedChallans] = useState([]);

  useEffect(() => {
    if (data?.data?.length > 0) {
      setRejectedChallans(data?.data);
    }
  }, [data]);

  const LeftSideHeader = () => {
    return (
      <div className="flex items-center space-x-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Challans Rejected
          </h1>
          <p className="text-sm text-gray-600 font-normal">
            Challans flagged as invalid or inaccurate
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

  // Show loading state
  if (loading) {
    return <Loader />;
  }
  if (rejectedChallans.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Rejected Challans
        </h3>
        <p className="text-gray-500 mb-4">
          There are currently no challans marked as rejected.
        </p>
        <p className="text-sm text-gray-400">
          Once a challan is reviewed and rejected by an officer, it will appear
          in this list.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        LeftSideHeader={<LeftSideHeader />}
        RightSideHeader={<RightSideHeader />}
      />
      <div className="bg-white flex-grow border rounded-lg shadow-sm  border-gray-200 m-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 ">ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Review reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rejectedChallans?.map((challan) => (
                <tr key={challan?.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {challan?.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {challan?.reviewed_at
                      ? new Date(challan?.reviewed_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {challan?.filename ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      title={challan?.review_reason ?? "Rejected"}
                      className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 inset-ring inset-ring-red-600/10 uppercase"
                    >
                      {challan?.review_action ?? "Rejected"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {challan?.review_reason ?? "Rejected"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChallansRejected;
