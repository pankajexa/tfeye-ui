import { Header } from "@/components";
import { Button } from "@/components/ui/button";
import ImageDetails from "@/components/ImageDetails/ImageDetails";
import { ClipboardList, Eye, CheckCircle, X } from "lucide-react";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Loader } from "@/components";
import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { apiService } from "@/services/api";
import { globals } from "@/constants/globalConstants";
import { useToast } from "@/components/toast";
import { useAuth } from "@/context/AuthContext";
import { Challan } from "@/types";

interface ViolationType {
  id: string;
  name: string;
  section: string | null;
  penalties: string | null;
  penaltyPoints: string | null;
}

const ChallanDetails: React.FC<{ url: string }> = ({ url }) => {
  const { currentOfficer } = useAuth();

  const { data, loading } = useAnalyses(url);
  const [pendingReviews, setPendingReviews] = useState<Challan[]>([]);
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeChallana, setActiveChallana] = useState<Challan | null>(null);
  const [previousChallans, setPreviousChallans] = useState<any>(null);
  const [previousChallansLoading, setPreviousChallansLoading] = useState(false);
  const [allViolationData, setAllViolationData] = useState<ViolationType[]>([]);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [focusedButton, setFocusedButton] = useState<"reject" | "approve">(
    "approve"
  );
  const [showGenerateConfirmation, setShowGenerateConfirmation] =
    useState(false);
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [violations, setViolations] = useState<string[]>([]);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const approveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (data?.data?.length > 0) {
      setPendingReviews(data?.data);
      const safeIndex = currentIndex ?? 0;

      // check length before accessing
      if (
        Array.isArray(data?.data) &&
        safeIndex >= 0 &&
        safeIndex < data.data.length
      ) {
        setActiveChallana(data.data[safeIndex]);
        setCurrentIndex(safeIndex);
      } else {
        setActiveChallana(data?.data?.[0]);
        setCurrentIndex(0);
      }
    }
  }, [data]);

  const loadAllViolationsData = async () => {
    try {
      setButtonLoader(true);
      const data = await apiService.getDatabaseViolations();
      if (data.success) {
        const uniqueData = Array.from(
          new Map(
            (data?.data || [])?.map((item: any) => [item?.offence_cd, item])
          ).values()
        ) as ViolationType[];
        setAllViolationData(uniqueData);
      }
    } catch (error) {
      setAllViolationData([]);
      setButtonLoader(false);
      return null;
    } finally {
      setButtonLoader(false);
    }
  };

  const handleViewPreviousChallans = async () => {
    // Debug: Log the active challan data to understand structure
    console.log("🔍 Active Challan Data:", activeChallana);
    console.log("🔍 Available vehicle number fields:", {
      plateNumber: activeChallana?.plateNumber,
      modified_vehicle_details: (activeChallana as any)?.modified_vehicle_details?.registrationNumber,
      parameter_analysis: (activeChallana as any)?.parameter_analysis?.rta_data_used?.registrationNumber,
      rtaVerification: activeChallana?.rtaVerification?.registrationNumber,
      ocrData: activeChallana?.ocrData?.license_plate,
      qualityAssessment: (activeChallana as any)?.qualityAssessment?.extracted_license_plate
    });

    // Try to get vehicle number from multiple possible locations
    const vehicleNumber = 
      activeChallana?.plateNumber ||
      (activeChallana as any)?.modified_vehicle_details?.registrationNumber ||
      (activeChallana as any)?.parameter_analysis?.rta_data_used?.registrationNumber ||
      activeChallana?.rtaVerification?.registrationNumber ||
      activeChallana?.ocrData?.license_plate ||
      (activeChallana as any)?.qualityAssessment?.extracted_license_plate;

    console.log("🚗 Selected vehicle number:", vehicleNumber);

    if (!vehicleNumber) {
      showErrorToast({
        heading: "Error",
        description: "No vehicle number found for current challan. Please ensure the challan has been processed and contains license plate information.",
        placement: "top-right",
      });
      return;
    }

    setPreviousChallansLoading(true);
    try {
      const result = await apiService.getPreviousChallans(vehicleNumber);
      
      if (result.success) {
        setPreviousChallans(result.data);
        showSuccessToast({
          heading: "Vehicle Details Retrieved",
          description: `Found vehicle details for ${vehicleNumber}. ${result.data?.data?.imageURLs?.length || 0} previous challan images available.`,
          placement: "top-right",
        });
      } else {
        showErrorToast({
          heading: "No Previous Challans",
          description: result.error || "No previous challans found for this vehicle.",
          placement: "top-right",
        });
        // Still show modal with empty state for better UX
        setPreviousChallans({ responseCode: "0", responseDesc: "No data", data: null });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch previous challans";
      showErrorToast({
        heading: "Error",
        description: `Failed to fetch previous challans: ${errorMessage}`,
        placement: "top-right",
      });
      console.error("Failed to fetch previous challans:", error);
    } finally {
      setPreviousChallansLoading(false);
    }
  };

  useEffect(() => {
    loadAllViolationsData();
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when not in a modal or input field
      if (
        showRejectOptions ||
        showGenerateConfirmation ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          setFocusedButton("reject");
          break;
        case "ArrowRight":
          event.preventDefault();
          setFocusedButton("approve");
          break;
        case "Enter":
          event.preventDefault();
          if (focusedButton === "reject") {
            setShowRejectOptions(true);
          } else if (focusedButton === "approve") {
            setShowGenerateConfirmation(true);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedButton, showRejectOptions, showGenerateConfirmation]);

  const handleUpdateLicensePlate = async (payload: any) => {
    try {
      setButtonLoader(true);

      const response = await fetch(
        `${globals?.BASE_URL}/api/update-license-plate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update license plate");
      }

      const data = await response.json();
      showSuccessToast({
        heading: "License Plate Updated",
        description: `New license plate set to ${payload?.new_license_plate}.`,
        placement: "top-right",
      });

      const pendingReviewsData = pendingReviews?.map((item) =>
        item?.id === activeChallana?.id
          ? {
              ...item,
              modified_vehicle_details:
                data?.data?.modified_vehicle_details ||
                (item as any)?.modified_vehicle_details,
            }
          : item
      );

      setPendingReviews(pendingReviewsData);
      setActiveChallana((prev) => ({
        ...prev,
        modified_vehicle_details:
          data?.data?.modified_vehicle_details ||
          (prev as any)?.modified_vehicle_details,
      } as Challan));
    } catch (error: any) {
      showErrorToast({
        heading: "Error",
        description: error.message || "Something went wrong.",
        placement: "top-right",
      });
    } finally {
      setButtonLoader(false);
    }
  };

  const handleUpdateViolations = async (violationTypes: any) => {
    try {
      setButtonLoader(true);
      if (!violationTypes || violationTypes.length === 0) {
        showErrorToast({
          heading: "No Violations Selected",
          description:
            "Please select at least one violation type before updating.",
          placement: "top-right",
        });
        return;
      }

      const response = await fetch(
        `${globals?.BASE_URL}/api/v1/analyses/${activeChallana?.id}/violations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ violation_types: violationTypes }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update violations");
      }

      showSuccessToast({
        heading: "Violations Updated",
        description: `Violations updated successfully for challan ${activeChallana?.id}.`,
        placement: "top-right",
      });

      setPendingReviews((prev) =>
        prev.map((item) =>
          item?.id === activeChallana?.id
            ? {
                ...item,
                vio_data: violationTypes || [],
              }
            : item
        )
      );
    } catch (error: any) {
      showErrorToast({
        heading: "Error",
        description: error.message || "Something went wrong.",
        placement: "top-right",
      });
    } finally {
      setButtonLoader(false);
    }
  };

  const handleUpdateChallan = async (challanId: any, value: any, type: any) => {
    try {
      // Build payload dynamically

      if (type === "NUMBER_UPDATE") {
        const payload = {
          uuid: challanId,
          new_license_plate: value,
          officer_id: currentOfficer?.id,
        };
        handleUpdateLicensePlate(payload);
      }
      if (type === "VIOLATIONS_UPDATE") {
        handleUpdateViolations(value);
      }
    } catch (error) {
      return null;
    }
  };

  const handleApprovedChallana = async () => {
    try {
      setButtonLoader(true);

      if (violations.length === 0) {
        showErrorToast({
          heading: "No Violations",
          description: "At least one violation type must be selected.",
          placement: "top-right",
        });
        return;
      }

      const response = await fetch(
        `${globals?.BASE_URL}/api/v1/analyses/${activeChallana?.id}/review?status=approved`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Something went wrong");
      }

      showSuccessToast({
        heading: "Approved Successfully",
        description: `Challan ${activeChallana?.plateNumber} approved.`,
        placement: "top-right",
      });

      // Auto-move to next challan after approval
      if (currentIndex < pendingReviews.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setActiveChallana(pendingReviews[currentIndex + 1]);
      }
      const newPendingReviews = pendingReviews?.filter(
        (item) => item.id !== activeChallana?.id
      );
      setPendingReviews(newPendingReviews);
      setShowGenerateConfirmation(false);
    } catch (error: any) {
      showErrorToast({
        heading: "Error",
        description: error.message || "Failed to approve challan.",
        placement: "top-right",
      });
    } finally {
      setButtonLoader(false);
    }
  };

  // Show loading state
  if (loading) {
    return <Loader />;
  }

  const LeftSideHeader = () => {
    return (
      <div className="flex items-center space-x-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Challan Details</h1>
          <p className="text-sm text-muted font-normal">
            Verify and approve detected violations to proceed with challan
            generation.
          </p>
        </div>
      </div>
    );
  };
  const RightSideHeader = () => {
    return (
      <div className="flex items-center space-x-3">
        <Button
          variant={"secondary"}
          onClick={handleViewPreviousChallans}
          disabled={previousChallansLoading}
        >
          <Eye />
          {previousChallansLoading ? "Loading..." : "View Previous Challans"}
        </Button>
        <Button
          ref={rejectButtonRef}
          disabled={buttonLoader}
          variant={"outline"}
          onClick={() => setShowRejectOptions(true)}
        >
          <X />
          Reject
        </Button>
        <Button
          ref={approveButtonRef}
          disabled={buttonLoader}
          onClick={() => setShowGenerateConfirmation(true)}
        >
          <CheckCircle />
          Generate e-Challan
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <Header
        LeftSideHeader={<LeftSideHeader />}
        RightSideHeader={<RightSideHeader />}
      />
      <Modal
        open={previousChallans !== null}
        onOpenChange={(o) => {
          if (!o) setPreviousChallans(null);
        }}
        title="Previous Challan Details"
        size="lg"
        description=""
        children={
          previousChallans ? (
            <div className="space-y-4">
              {/* Vehicle Info */}
              <div className="space-y-2 grid lg:grid-cols-2 text-sm text-primary">
                <p>
                  <strong>Regn No:</strong> {previousChallans?.data?.regnNo}
                </p>
                <p>
                  <strong>Color:</strong> {previousChallans?.data?.color}
                </p>
                <p>
                  <strong>Wheeler:</strong> {previousChallans?.data?.wheeler}
                </p>
                <p>
                  <strong>Maker:</strong> {previousChallans?.data?.maker}
                </p>
                <p>
                  <strong>Model:</strong> {previousChallans?.data?.model}
                </p>
                <p>
                  <strong>Vehicle Type:</strong>{" "}
                  {previousChallans?.data?.vehtype}
                </p>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Previous Challan Images
                </h3>
                {previousChallans?.data?.imageURLs?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {previousChallans?.data?.imageURLs?.map(
                      (url: string, idx: number) => (
                        <a href={url} target="_blank" key={idx}>
                          <img
                            src={url}
                            alt={`Challan-${idx}`}
                            className="w-full h-32 object-cover rounded border"
                          />
                        </a>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No previous challan images available for this vehicle.</p>
                    <p className="text-sm mt-2">
                      This shows vehicle details from RTA database. 
                      Previous challan images are not available through this data source.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null
        }
        footer={
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setPreviousChallans(null)}>
              Close
            </Button>
          </div>
        }
      />

      {/* Generate Confirmation Modal */}
      <Modal
        open={showGenerateConfirmation}
        onOpenChange={(o) => {
          if (!o) setShowGenerateConfirmation(false);
        }}
        title="Confirm e-Challan Generation"
        size="md"
        description="Are you sure you want to generate an e-challan for this violation?"
        children={
          <div className="space-y-4">
            {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Final Confirmation Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This action will generate an official e-challan for:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Vehicle: {activeChallana?.plateNumber || 'N/A'}</li>
                      <li>Violations: {activeChallana?.violations?.length || 0} detected</li>
                    </ul>
                    <p className="mt-2 font-medium">This action cannot be undone.</p>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        }
        footer={
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowGenerateConfirmation(false)}
            >
              Cancel
            </Button>
            <Button disabled={buttonLoader} onClick={handleApprovedChallana}>
              {buttonLoader ? "Generating..." : "Confirm & Generate"}
            </Button>
          </div>
        }
      />

      <div className="flex-grow px-6 pt-2">
        {pendingReviews?.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-primary">
                Pending Review
              </h2>
              <span className="text-sm text-muted">0 items</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-8 text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">
                  No Items Pending Review
                </h3>
                <p className="text-muted mb-4">
                  Images with detected violations will appear here for manual
                  review and approval.
                </p>
                <p className="text-sm text-muted">
                  Upload traffic images in the Image Intake tab to start the
                  analysis process.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ImageDetails
            pendingChallans={pendingReviews || []}
            showRejectOptions={showRejectOptions}
            setShowRejectOptions={setShowRejectOptions}
            setCurrentIndex={setCurrentIndex}
            currentIndex={currentIndex}
            setActiveChallana={setActiveChallana}
            activeChallana={activeChallana}
            allViolationData={allViolationData}
            handleUpdateChallan={handleUpdateChallan}
            setAllViolationData={setAllViolationData}
            setPendingReviews={setPendingReviews}
            setViolations={setViolations}
            violations={violations}
          />
        )}
      </div>
    </div>
  );
};

export default ChallanDetails;
