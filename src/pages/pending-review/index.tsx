import { useState } from "react";
import { Upload, CheckCircle, Copy } from "lucide-react";
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
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { apiService } from "@/services/api";
import { useToast } from "@/components/toast";

const PendingForReview = () => {
  const { data, loading, error, refetch } = useAnalyses(
    `api/v1/analyses?status=pending&items_per_page=50&page=1`
  );
  const { pointDetails, loading: pLoading, error: pError } = usePointNames();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPointName, setSelectedPointName] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{ id: string; licensePlate: string } | null>(null);
  const [manualLicensePlate, setManualLicensePlate] = useState("");
  const [modificationReason, setModificationReason] = useState("");
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  const handleDuplicateAnalysis = async () => {
    if (!selectedAnalysis || !manualLicensePlate.trim()) {
      showErrorToast({
        heading: "Error",
        description: "Please enter a valid license plate number",
        placement: "top-right",
      });
      return;
    }

    setDuplicateLoading(true);
    try {
      const result = await apiService.duplicateAnalysis(
        selectedAnalysis.id,
        manualLicensePlate,
        modificationReason || "License plate correction by officer"
      );

      if (result.success) {
        showSuccessToast({
          heading: "Success",
          description: "Duplicate analysis created successfully",
          placement: "top-right",
        });
        setShowDuplicateModal(false);
        refetch(`api/v1/analyses?status=pending&items_per_page=50&page=${currentPage}`);
      } else {
        showErrorToast({
          heading: "Error",
          description: result.error || "Failed to create duplicate analysis",
          placement: "top-right",
        });
      }
    } catch (error) {
      showErrorToast({
        heading: "Error",
        description: error instanceof Error ? error.message : "Failed to create duplicate analysis",
        placement: "top-right",
      });
    } finally {
      setDuplicateLoading(false);
    }
  };

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
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              setSelectedAnalysis({
                id: row?.original?.id,
                licensePlate: row?.original?.license_plate_number || ""
              });
              setManualLicensePlate(row?.original?.license_plate_number || "");
              setShowDuplicateModal(true);
            }}
            title="Create duplicate with corrected license plate"
          >
            <Copy className="h-4 w-4" />
          </Button>
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

      {/* Duplicate Analysis Modal */}
      <Modal
        open={showDuplicateModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowDuplicateModal(false);
            setSelectedAnalysis(null);
            setManualLicensePlate("");
            setModificationReason("");
          }
        }}
        title="Create Duplicate Analysis"
        description="Create a duplicate analysis with a corrected license plate number."
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Original License Plate</label>
            <Input
              value={selectedAnalysis?.licensePlate || ""}
              disabled
              placeholder="Original license plate"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Corrected License Plate <span className="text-red-500">*</span>
            </label>
            <Input
              value={manualLicensePlate}
              onChange={(e) => setManualLicensePlate(e.target.value)}
              placeholder="Enter corrected license plate"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Modification Reason</label>
            <Input
              value={modificationReason}
              onChange={(e) => setModificationReason(e.target.value)}
              placeholder="Enter reason for correction (optional)"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowDuplicateModal(false);
              setSelectedAnalysis(null);
              setManualLicensePlate("");
              setModificationReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDuplicateAnalysis}
            disabled={duplicateLoading || !manualLicensePlate.trim()}
          >
            {duplicateLoading ? "Creating..." : "Create Duplicate"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PendingForReview;
