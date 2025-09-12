import { Header } from "@/components";
import { Button } from "@/components/ui/button";
import ImageDetails from "@/components/ImageDetails/ImageDetails";
import { ClipboardList, Eye, CheckCircle, X } from "lucide-react";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Loader } from "../../components";
import { useState, useEffect, useRef } from "react";
import { Modal } from "../../components/ui/modal";
import { apiService } from "../../services/api";
import { globals } from "@/constants/globalConstants";
import { useToast } from "@/components/toast";
import { useAuth } from "../../context/AuthContext";
import { Challan } from "@/types";

const previousChallansResponse = {
  responseDesc: "Success",
  data: {
    regnNo: "TS13UB3768",
    color: "RED",
    wheeler: "4",
    imageURLs: [
      "https://echallan.tspolice.gov.in/p4/Evidences/23/pending/MR/2023/10/28/2303/2303120004/HYD03ME230019093.jpg",
      "https://echallan.tspolice.gov.in/p4/Evidences/23/pending/MR/2023/06/10/2328/2328120004/HYD28EC236034157.jpg",
      "https://echallan.tspolice.gov.in/p4/Evidences/23/pending/MR/2023/05/02/2330/2300120010/HYD00SC234879240.jpg",
      "https://echallan.tspolice.gov.in/p4/Evidences/23/pending/MR/2023/05/02/2313/2313130008/HYD13TE238062997.jpg",
    ],
    maker: "MAHINDRA & MAHINDRA LTD",
    model: "MAHINDRA JEETO S6-11 BSIV",
    vehtype: "Goods Carriage",
  },
  responseCode: "0",
};

interface ViolationType {
  id: string;
  name: string;
  section: string | null;
  penalties: string | null;
  penaltyPoints: string | null;
}

const PendingForReview: React.FC = () => {
  const { currentOfficer } = useAuth();
  const { data, loading, refetch } = useAnalyses("pending", 50, 0);
  const [pendingReviews, setPendingReviews] = useState<Challan[]>([]);
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeChallana, setActiveChallana] = useState(null);
  const [previousChallans, setPreviousChallans] = useState<any>(null);
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
            (data?.data || [])?.map((item) => [item?.offence_cd, item])
          ).values()
        );
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
                item?.modified_vehicle_details,
            }
          : item
      );

      setPendingReviews(pendingReviewsData);
      setActiveChallana((prev) => ({
        ...prev,
        modified_vehicle_details:
          data?.data?.modified_vehicle_details ||
          item?.modified_vehicle_details,
      }));
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

      console.log('🚔 Starting challan generation process...');

      // First, get the operator token from localStorage
      const authData = localStorage.getItem('traffic_challan_auth');
      if (!authData) {
        throw new Error('Authentication data not found. Please login again.');
      }

      const { operatorToken } = JSON.parse(authData);
      if (!operatorToken) {
        throw new Error('Operator token not found. Please login again.');
      }

      // First, fetch the analysis results data from database to get correct field values
      console.log('📊 Fetching analysis results for UUID:', activeChallana?.uuid || activeChallana?.id);
      let analysisResults = null;
      try {
        const response = await fetch(
          `${globals?.BASE_URL}/api/analysis/${activeChallana?.uuid || activeChallana?.id}`
        );
        if (response.ok) {
          analysisResults = await response.json();
          console.log('✅ Analysis results fetched:', analysisResults);
        } else {
          console.warn('⚠️ Could not fetch analysis results, using fallback values');
        }
      } catch (fetchError) {
        console.warn('⚠️ Error fetching analysis results:', fetchError);
      }

      // Extract data from analysis results or use fallbacks
      const analysisData = analysisResults?.data || analysisResults || {};

      // Prepare challan data for TSeChallan API with correct field mappings
      const challanData = {
        offenceDtTime: analysisData.offence_date && analysisData.offence_time
          ? `${analysisData.offence_date} ${analysisData.offence_time}`
          : (activeChallana?.created_at
              ? new Date(activeChallana.created_at).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).replace(',', '')
              : new Date().toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).replace(',', '')),

        vioData: analysisData.vio_data
          ? (Array.isArray(analysisData.vio_data)
              ? analysisData.vio_data
              : String(analysisData.vio_data).split(',').map(v => v.trim()))
          : violations.map(v => v.id || v).filter(Boolean),

        capturedByCD: analysisData.captured_by_cd || analysisData.capturedByCD || 'UNKNOWN',

        operatorCD: analysisData.operator_cd || analysisData.operatorCD || currentOfficer?.id || 'UNKNOWN',

        vehRemak: 'N', // Always 'N' when generating challan

        vehicleNo: analysisData.license_plate_number || analysisData.vehicleNo || activeChallana?.plateNumber || '',

        pointCD: analysisData.point_cd || analysisData.point_name || analysisData.pointCD || activeChallana?.point_name || '230001',

        gpsLatti: analysisData.latitude || analysisData.gpsLatti || '17.414',

        gpsLong: analysisData.longitude || analysisData.gpsLong || '78.4279',

        gpsLocation: analysisData.location || analysisData.gpsLocation || 'TG ICCC, Hyderabad'
      };

      console.log('📋 Challan data prepared:', challanData);

      // Get the image file
      let imageFile: File | null = null;
      try {
        // First try to get presigned URL and convert to blob
        const imageResponse = await apiService.getImagePresignedUrl(activeChallana?.uuid || activeChallana?.id);
        if (imageResponse.success && imageResponse.presignedUrl) {
          const imageBlob = await fetch(imageResponse.presignedUrl).then(r => r.blob());
          imageFile = new File([imageBlob], 'violation_image.jpg', { type: 'image/jpeg' });
        }
      } catch (imageError) {
        console.error('❌ Failed to get image file:', imageError);
        throw new Error('Failed to retrieve image file for challan generation');
      }

      if (!imageFile) {
        throw new Error('Image file is required for challan generation');
      }

      // Generate challan using TSeChallan API
      const challanResult = await apiService.generateChallan(
        challanData,
        imageFile,
        undefined, // video file (optional)
        operatorToken
      );

      if (!challanResult.success) {
        throw new Error(challanResult.error || 'Challan generation failed');
      }

      // If challan generation successful, also update local database status
      try {
        const response = await fetch(
          `${globals?.BASE_URL}/api/v1/analyses/${activeChallana?.id}/review?status=approved`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          console.warn('⚠️ Local database update failed, but challan was generated successfully');
        }
      } catch (dbError) {
        console.warn('⚠️ Local database update failed:', dbError);
      }

      // Show success message with challan number if available
      const challanNumber = challanResult.challanNumber || 'Generated';
      showSuccessToast({
        heading: "Challan Generated Successfully",
        description: `Challan ${challanNumber} has been generated for vehicle ${activeChallana?.plateNumber}.`,
        placement: "top-right",
      });

      // Auto-move to next challan after successful generation
      if (currentIndex < pendingReviews.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setActiveChallana(pendingReviews[currentIndex + 1]);
      }

      // Remove from pending reviews list
      const newPendingReviews = pendingReviews?.filter(
        (item) => item.id !== activeChallana?.id
      );
      setPendingReviews(newPendingReviews);
      setShowGenerateConfirmation(false);

    } catch (error: any) {
      console.error('💥 Challan generation error:', error);
      showErrorToast({
        heading: "Challan Generation Failed",
        description: error.message || "Failed to generate challan. Please try again.",
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
          onClick={() => setPreviousChallans(previousChallansResponse)}
        >
          <Eye />
          View Previous Challans
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
          Generate Challan
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
        title="Generate Challan"
        size="md"
        description="This will generate an official challan through TSeChallan API"
        children={
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Challan Details
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>This will generate an official challan for:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Vehicle: {activeChallana?.plateNumber || 'N/A'}</li>
                      <li>Violations: {violations?.length || 0} selected</li>
                      <li>Officer: {currentOfficer?.name || 'Unknown'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
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
              {buttonLoader ? "Generating Challan..." : "Generate Challan"}
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
            refetch={refetch}
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

export default PendingForReview;
