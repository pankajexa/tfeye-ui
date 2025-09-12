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
  { id: "all", name: "All" },
  { id: "system-rejected", name: "System Rejected" },
  { id: "operator-rejected", name: "Operator Rejected" },
];

const ChallansRejected = () => {
  const { data, loading, error } = useAnalyses("rejected", 50, 0);
  const [rejectedChallans, setRejectedChallans] = useState([]);
  const [searchStatus, setSearchStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  //Show loading state
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

  const columns = [
    {
      accessorKey: "name",
      header: "Image ID",
      cell: ({ row }) => (
        <div className="flex  gap-3 items-center text-sm">
          {/* <image
              src={row?.original?.image_url || "/placeholder.png"}
              alt="vehicle image"
              className="w-[40px] h-[40px] object-cover rounded-sm border"
            /> */}
          <div>
            <p className="font-medium text-gray-900 hover:text-purple-500">
              {row?.original?.uuid}
            </p>
            <p className=" text-gray-600">{row?.original?.point_name}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Captured at",
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 font-normal">
          {dateFormat(row?.original?.created_at, "datetime")}
        </p>
      ),
    },
    {
      accessorKey: "point_name",
      header: "Location",
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 font-normal">
          {row?.original?.point_name}
        </p>
      ),
    },

    {
      accessorKey: "violation_types",
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
    <div className="flex flex-col h-full">
      <Header
        LeftSideHeader={<LeftSideHeader />}
        RightSideHeader={<RightSideHeader />}
      />
      <div className="flex flex-col flex-grow m-6">
        {/* <div>
          <div className="mb-5">
            <h2 className="text-lg flex items-center gap-1.5 text-gray-900 font-semibold">
              Challans Rejected{" "}
              <Badge rounded={"full"} variant="purple">
                20
              </Badge>{" "}
            </h2>
          </div>
        </div>
        <div className="max-w-fit mb-3">
          <ListGridView
            nameShow={true}
            templateViewType={searchStatus}
            options={rejectedSubTabs}
            onChange={(status) => setSearchStatus(status)}
          />
        </div> */}
        <ReusableTable
          columns={columns}
          data={rejectedChallans}
          visibleColumns={5}
          currentPage={currentPage}
          itemsPerPage={50}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default ChallansRejected;
