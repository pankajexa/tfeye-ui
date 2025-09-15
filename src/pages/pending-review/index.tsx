import { useState } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { Header } from "@/components";
import { Button } from "@/components/ui/button";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Loader } from "../../components";
import { Link } from "react-router-dom";
import ReusableTable from "@/components/ui/ReusableTable";
import { Badge } from "@/components/ui/Badge";
import { dateFormat } from "@/utils/dateFormat";
import { usePointNames } from "@/hooks/usePointNames";
import { Select } from "@/components/ui/select";

const PendingForReview = () => {
  const { data, loading, error, refetch } = useAnalyses(
    `api/v1/analyses?status=pending&items_per_page=50&page=1`
  );
  const { pointDetails, loading: pLoading, error: pError } = usePointNames();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPointName, setSelectedPointName] = useState(null);

  const loadNext = (url: string) => {
    refetch(url);
  };

  const LeftSideHeader = () => (
    <div className="flex items-center space-x-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending for Review</h1>
        <p className="text-sm text-gray-600 font-normal">
          Verify and approve detected violations to proceed with challan
          generation.
        </p>
      </div>
    </div>
  );

  const RightSideHeader = () => (
    <div className="flex items-center space-x-3">
      <Link to="/bulk-upload">
        <Button>
          <Upload /> Upload Photos
        </Button>
      </Link>
    </div>
  );

  if (loading) {
    return <Loader />;
  }

  const getNavigationLink = (id: string) => {
    let url = `/pending-review/${id}`;
    const queryParams: string[] = [];

    if (selectedPointName) {
      queryParams.push(`point_name=${encodeURIComponent(selectedPointName)}`);
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }

    return url;
  };
  const columns = [
    {
      accessorKey: "license_plate_number",
      header: "Vehicle Number",
      cell: ({ row }) => (
        <div className="flex gap-3 items-center text-sm">
          <Link to={getNavigationLink(row?.original?.id)}>
            <p className="font-medium text-gray-900 hover:text-purple-500">
              {row?.original?.license_plate_number || "N/A"}
            </p>
          </Link>
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

  return (
    <div className="flex flex-col h-screen">
      <Header
        LeftSideHeader={<LeftSideHeader />}
        RightSideHeader={<RightSideHeader />}
      />
      <div className="flex flex-col flex-grow m-6">
        <div className="w-full flex items-center justify-between pb-3">
          <h2 className="text-lg flex items-center gap-1.5 text-gray-900 font-semibold">
            Challans{" "}
            <Badge rounded="full" variant="purple">
              {data?.pagination?.total_count || 0}
            </Badge>
          </h2>
          <div className="w-[320px]">
            <Select
              label=""
              placeholder="Select point name"
              value={selectedPointName}
              onValueChange={(value) => {
                let url = `api/v1/analyses?status=pending&items_per_page=50&page=${currentPage}`;

                if (value) {
                  url += `&point_name=${encodeURIComponent(value)}`;
                }

                loadNext(url);
                setSelectedPointName(value as string);
              }}
              options={pointDetails || []}
              searchable={true}
            />
          </div>
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
            let url = `api/v1/analyses?status=pending&items_per_page=50&page=${page}`;

            if (selectedPointName) {
              url += `&point_name=${encodeURIComponent(selectedPointName)}`;
            }

            loadNext(url);
          }}
          tableHeight="h-[calc(100vh-184px)]"
          totalRecords={data?.pagination?.total_count || 0}
        />
      </div>
    </div>
  );
};

export default PendingForReview;
