import { useState, useEffect } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { Header } from "@/components";
import { Button } from "@/components/ui/button";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Loader } from "../../components";
import ListGridView from "@/components/ui/ListGridView";
import { Link } from "react-router-dom";
import ReusableTable from "@/components/ui/ReusableTable";
import { Badge } from "@/components/ui/Badge";
import { dateFormat } from "@/utils/dateFormat";

const rejectedSubTabs = [
  // { id: "all", name: "All" },
  { id: "system_rejected", name: "System Rejected" },
  { id: "officer_rejected", name: "Operator Rejected" },
];

const ChallansRejected = () => {
  const { data, loading, error, refetch } = useAnalyses(
    `api/v1/analyses?status=rejected&sub_status=system_rejected&items_per_page=50&page=1`
  );
  const [searchStatus, setSearchStatus] = useState("system_rejected");
  const [currentPage, setCurrentPage] = useState(1);

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

  //Show loading state
  if (loading) {
    return <Loader />;
  }
  if (data?.data?.length === 0) {
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

  const columns = [
    {
      accessorKey: "license_plate_number",
      header: "Vehicle Number",
      cell: ({ row }) => (
        <div className="flex gap-3 items-center text-sm">
          <p className="font-medium text-gray-900">
            {row?.original?.license_plate_number || "N/A"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Captured time",
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 font-normal">
          {dateFormat(row?.original?.created_at, "datetime")}
        </p>
      ),
    },
    {
      accessorKey: "image_captured_by_name",
      header: "Capture by",
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 font-normal">
          {row?.original?.image_captured_by_name}
        </p>
      ),
    },
    {
      accessorKey: "point_name",
      header: "Point name",
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 font-normal">
          {row?.original?.point_name}
        </p>
      ),
    },
    {
      accessorKey: "vio_data",
      header: "Violation type",
      cell: ({ row }) => (
        <div className="space-x-2 flex flex-wrap">
          {row?.original?.vio_data?.map((vio, index) => (
            <Badge key={index}>{vio?.detected_violation}</Badge>
          ))}
        </div>
      ),
    },
  ];

  const loadNext = (url: string) => {
    refetch(url);
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        LeftSideHeader={<LeftSideHeader />}
        RightSideHeader={<RightSideHeader />}
      />
      <div className="flex flex-col flex-grow m-6">
        <div>
          <div className="mb-5">
            <h2 className="text-lg flex items-center gap-1.5 text-gray-900 font-semibold">
              Challans Rejected{" "}
              <Badge rounded={"full"} variant="purple">
                {data?.pagination?.total_count || 0}
              </Badge>{" "}
            </h2>
          </div>
        </div>
        <div className="max-w-fit mb-3">
          <ListGridView
            nameShow={true}
            templateViewType={searchStatus}
            options={rejectedSubTabs}
            onChange={(status) => {
              setSearchStatus(status);
              loadNext(
                `api/v1/analyses?status=rejected&sub_status=${status}&items_per_page=50&page=${currentPage}`
              );
            }}
          />
        </div>
        <ReusableTable
          key={currentPage}
          columns={columns}
          data={data?.data || []}
          visibleColumns={5}
          currentPage={currentPage}
          itemsPerPage={50}
          onPageChange={(page) => {
            setCurrentPage(page);
            loadNext(
              `api/v1/analyses?status=rejected&sub_status=${searchStatus}&items_per_page=50&page=${page}`
            );
          }}
          tableHeight="h-[calc(100vh-220px)]"
          totalRecords={data?.pagination?.total_count || 0}
        />
      </div>
    </div>
  );
};

export default ChallansRejected;
