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

const violationVariants = [
  // "red",
  // "yellow",
  // "green",
  "blue",
  "orange",
  "indigo",
  "pink",
  "purple",
  "teal",
];

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

  const getNavigationLink = (id: string) => {
    let url = `/challans-rejected/${id}`;
    const queryParams: string[] = [];

    if (searchStatus) {
      queryParams.push(`sub_status=${encodeURIComponent(searchStatus)}`);
    }

     if (currentPage !== undefined) {
      queryParams.push(`page=${currentPage}`);
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
      cell: ({ row }) => {
        const licensePlate = row?.original?.license_plate_number || "N/A";
        const id = row?.original?.id;

        return (
          <div className="flex gap-3 items-center text-sm">
            {searchStatus === "system_rejected" ? (
              <Link to={getNavigationLink(id)}>
                <p className="font-medium text-gray-900 hover:text-purple-500">
                  {licensePlate}
                </p>
              </Link>
            ) : (
              <p className="font-medium text-gray-900">{licensePlate}</p>
            )}
          </div>
        );
      },
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
        <div className="gap-2 flex flex-wrap max-w-[300px]">
          {row?.original?.vio_data?.map((vio, index) => (
            <Badge
              key={index}
              variant={violationVariants[index < 7 ? index : 1]}
            >
              {vio?.violation_description}
            </Badge>
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
