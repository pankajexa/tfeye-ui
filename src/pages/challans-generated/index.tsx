import React, { useState, useEffect } from "react";
import { CheckCircle, Download, Car, Eye, X, Upload } from "lucide-react";
import { Header } from "@/components";
import { Button } from "@/components/ui/button";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Loader } from "../../components";
import { Link } from "react-router-dom";
import ReusableTable from "@/components/ui/ReusableTable";

const ChallansGenerated: React.FC = () => {
  const { data, loading, error } = useAnalyses("generated", 50, 0);
  const [approvedChallans, setApprovedChallans] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (data?.data?.length > 0) {
      setApprovedChallans(data?.data);
    }
  }, [data]);

//  const columns = [
//   {
//     accessorKey: "name",
//     header: "User Info",
//     cell: ({ row }) => (
//       <div className="flex flex-col">
//         <span className="font-medium">{row.original.name}</span>
//         <span className="text-xs text-gray-500">{row.original.email}</span>
//       </div>
//     ),
//   },
//   {
//     accessorKey: "role",
//     header: "Actions",
//     cell: ({ row }) => (
//       <div className="flex gap-2">
//         <button className="text-blue-600 hover:underline">View</button>
//         <button className="text-red-600 hover:underline">Delete</button>
//       </div>
//     ),
//   },
// ];

//   const sampleData = [
//     {
//       id: 1,
//       name: "John Doe",
//       email: "john@example.com",
//       role: "Developer",
//       status: "Active",
//       department: "Engineering",
//       location: "Bangalore",
//     },
//     {
//       id: 2,
//       name: "Jane Smith",
//       email: "jane@example.com",
//       role: "Designer",
//       status: "Inactive",
//       department: "Design",
//       location: "Mumbai",
//     },
//     {
//       id: 3,
//       name: "Alice Brown",
//       email: "alice@example.com",
//       role: "Product Manager",
//       status: "Active",
//       department: "Product",
//       location: "Hyderabad",
//     },
//     {
//       id: 4,
//       name: "Bob Williams",
//       email: "bob@example.com",
//       role: "QA Engineer",
//       status: "Active",
//       department: "QA",
//       location: "Delhi",
//     },
//     {
//       id: 5,
//       name: "Charlie Green",
//       email: "charlie@example.com",
//       role: "HR",
//       status: "Inactive",
//       department: "Human Resources",
//       location: "Chennai",
//     },
//   ];

  const LeftSideHeader = () => {
    return (
      <div className="flex items-center space-x-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Challans Generated
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
  if (approvedChallans.length === 0) {
    return (
      <div className="p-10 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Approved Challans
        </h3>
        <p className="text-gray-500 mb-4">
          Approved traffic violation challans will appear here, ready for final
          processing and issuance.
        </p>
        <p className="text-sm text-gray-400">
          Complete the review process for pending items to see approved challans
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header
        LeftSideHeader={<LeftSideHeader />}
        RightSideHeader={<RightSideHeader />}
      />

      <div className=" flex-grow m-6">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 ">ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Violation Types</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {approvedChallans?.map((challan) => (
                <tr key={challan?.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {challan?.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {challan?.created_at
                      ? new Date(challan?.created_at).toLocaleDateString(
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
                    <span className="inline-flex items-center rounded-md uppercase bg-green-50 px-2 py-1 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20">
                      {challan?.status ?? "Approved"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex gap-3 flex-wrap ">
                      {challan?.violation_types?.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex  items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 inset-ring inset-ring-gray-500/10"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        {/* <ReusableTable
          columns={columns}
          data={sampleData}
          visibleColumns={5}
          currentPage={currentPage}
          itemsPerPage={10}
          onPageChange={(page) => setCurrentPage(page)}
        /> */}
      </div>
    </div>
  );
};

export default ChallansGenerated;
