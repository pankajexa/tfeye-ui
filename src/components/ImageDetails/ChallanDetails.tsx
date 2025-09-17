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

// Extend Window interface for global cache
declare global {
  interface Window {
    challanUrlCache: Map<string, string>;
  }
}

interface ViolationType {
  id: string;
  name: string;
  section: string | null;
  penalties: string | null;
  penaltyPoints: string | null;
}

const ChallanDetails: React.FC<{ id: string; url: string }> = ({ id, url }) => {
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
  const [focusedButton, setFocusedButton] = useState<"reject" | "approve">("approve");
  const [showGenerateConfirmation, setShowGenerateConfirmation] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateLicensePlate, setDuplicateLicensePlate] = useState("");
  const [duplicateReason, setDuplicateReason] = useState("");
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [violations, setViolations] = useState<string[]>([]);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const approveButtonRef = useRef<HTMLButtonElement>(null);

  // Rolling preload strategy - always keep next 5 images ready
  const maintainRollingCache = async (currentIndex: number, challans: any[]) => {
    const urlCache = window.challanUrlCache || (window.challanUrlCache = new Map());
    
    // Calculate the range of images to keep cached (current + next 5)
    const startIndex = currentIndex;
    const endIndex = Math.min(currentIndex + 5, challans.length - 1);
    
    // Preload any missing images in the range
    const preloadPromises = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const challan = challans[i];
      if (challan?.uuid && !urlCache.has(challan.uuid)) {
        const preloadPromise = (async () => {
          try {
            const response = await apiService.getImagePresignedUrl(challan.uuid);
            if (response?.success && response?.presignedUrl) {
              urlCache.set(challan.uuid, response.presignedUrl);
              return true;
            }
          } catch (error) {
            console.error("Cache failed:", challan.id, error);
          }
          return false;
        })();
        
        preloadPromises.push(preloadPromise);
      }
    }
    
    if (preloadPromises.length > 0) {
      await Promise.all(preloadPromises);
    }
  };


  useEffect(() => {
    if (data?.data?.length > 0) {
      setPendingReviews(data.data);
      
      // Find the challan with matching ID
      const targetChallan = data.data.find((item: any) => String(item.id) === String(id));
      const targetIndex = data.data.findIndex((item: any) => String(item.id) === String(id));
      
      if (targetChallan && targetIndex !== -1) {
        setActiveChallana(targetChallan);
        setCurrentIndex(targetIndex);
        // Start rolling cache immediately
        setTimeout(() => maintainRollingCache(targetIndex, data.data), 100);
      } else {
        setActiveChallana(data.data[0]);
        setCurrentIndex(0);
        // Start rolling cache immediately
        setTimeout(() => maintainRollingCache(0, data.data), 100);
      }
    }
  }, [data, id]);


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
      } else {
        // Handle authentication errors silently, show modal with empty state
        if (result.error === "Authentication required") {
          setPreviousChallans({ responseCode: "0", responseDesc: "No data", data: null });
        } else {
          showErrorToast({
            heading: "No Previous Challans",
            description: "No previous challans found for this vehicle.",
            placement: "top-right",
          });
          // Still show modal with empty state for better UX
          setPreviousChallans({ responseCode: "0", responseDesc: "No data", data: null });
        }
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

      // Validate required data
      if (!globals?.BASE_URL) {
        throw new Error("Backend configuration missing. Please check your environment setup.");
      }

      if (!(activeChallana as any)?.uuid) {
        throw new Error("Invalid challan data. Please refresh and try again.");
      }

      console.log('👤 Current Officer Info:', currentOfficer);
      console.log('🔐 Authentication Status:', !!currentOfficer);

      // Get officer info (use currentOfficer or create with defaults)
      let officerInfo = currentOfficer;

      if (!officerInfo) {
        console.log('🔄 No officer info available, creating mock officer for testing...');
        officerInfo = {
          id: 'TEST_OFFICER_001',
          name: 'Test Officer',
          cadre: 'Police Constable',
          operatorCd: '23001007'
        } as any;
      } else {
        // Ensure required fields exist, add defaults if missing
        officerInfo = {
          id: officerInfo.id || (officerInfo as any).operatorCd || 'TEST_OFFICER_001',
          name: officerInfo.name || 'Test Officer',
          cadre: (officerInfo as any).cadre || 'Police Constable',
          operatorCd: (officerInfo as any).operatorCd || officerInfo.id || '23001007'
        } as any;
        console.log('✅ Enhanced officer info with defaults:', officerInfo);
      }

      console.log('🚔 Starting challan generation process...');

      // STEP 1: Prepare challan data (silent background process)
      const backendUrl = globals?.BASE_URL || 'http://localhost:3001';
      console.log('📡 API URL:', `${backendUrl}/api/challan/prepare`);
      console.log('🌐 Backend URL from globals:', globals?.BASE_URL);

      console.log('🔍 Raw officerInfo from source:', officerInfo);
      console.log('🔍 Officer info details:', {
        hasOfficerInfo: !!officerInfo,
        officerId: officerInfo?.id,
        officerName: officerInfo?.name,
        operatorCd: (officerInfo as any)?.operatorCd,
        allKeys: officerInfo ? Object.keys(officerInfo) : []
      });

      // Ensure we have valid officer info
      const finalOfficerInfo = {
        id: officerInfo?.id || (officerInfo as any)?.operatorCd || (officerInfo as any)?.operatorCD || 'DEFAULT_OFFICER_ID',
        name: officerInfo?.name || 'Unknown Officer',
        cadre: officerInfo?.cadre || 'Unknown',
        operatorCd: (officerInfo as any)?.operatorCd || (officerInfo as any)?.operatorCD || officerInfo?.id || '23001007'
      };

      console.log('🔍 Final officer info to send:', finalOfficerInfo);

      const preparePayload = {
        analysisUuid: (activeChallana as any)?.uuid,
        officerInfo: finalOfficerInfo,
        selectedViolations: violations?.map(v => ({
          id: v,
          violation_description: v,
          violation_cd: v
        })) || [],
        modifiedLicensePlate: (activeChallana as any)?.modified_vehicle_details?.registrationNumber ||
                             (activeChallana as any)?.parameter_analysis?.rta_data_used?.registrationNumber ||
                             (activeChallana as any)?.license_plate_number,
        modificationReason: "Officer review completed via UI"
      };

      console.log('📤 Prepare payload:', JSON.stringify(preparePayload, null, 2));

      const prepareResponse = await fetch(
        `${backendUrl}/api/challan/prepare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preparePayload)
        }
      );

      console.log('📥 Prepare response status:', prepareResponse.status, prepareResponse.statusText);

      if (!prepareResponse.ok) {
        const errorText = await prepareResponse.text();
        console.error('❌ Prepare API error:', errorText);
        const errorData = await prepareResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to prepare challan data");
      }

      const prepareData = await prepareResponse.json();
      console.log('✅ Challan prepared successfully:', prepareData);

      // STEP 2: Generate challan with TSeChallan API (background process)
      const authData = localStorage.getItem('traffic_challan_auth');
      let operatorToken = null;

      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          operatorToken = parsed.operatorToken || parsed.appSessionToken;
        } catch (error) {
          console.warn('⚠️ Could not parse auth data from localStorage');
        }
      }

      // Start background generation process with image file
      if (operatorToken) {
        // Fetch image from S3 and prepare FormData
        const formData = new FormData();

        try {
          // Fetch image from S3 URL
          const imageResponse = await fetch((activeChallana as any)?.image_s3_url);
          if (!imageResponse.ok) {
            throw new Error('Failed to fetch image from S3');
          }
          const imageBlob = await imageResponse.blob();
          const imageFile = new File([imageBlob], 'violation_image.jpg', { type: 'image/jpeg' });
          formData.append('img', imageFile);

          // Add challan data matching the expected format
          // Convert violations to array format as expected by backend
          let vioDataArray = [];
          const vioData = prepareData?.data?.vio_data;
          if (Array.isArray(vioData)) {
            vioDataArray = vioData;
          } else if (typeof vioData === 'string' && vioData.includes(',')) {
            // Handle comma-separated string format
            vioDataArray = vioData.split(',').map(code => code.trim()).filter(code => code);
          } else if (vioData) {
            // Single value
            vioDataArray = [vioData.toString()];
          } else {
            // Default fallback
            vioDataArray = ["1"];
          }

          // Format date as DD-MMM-YYYY HH:MM (e.g., 05-Sep-2024 16:15)
          const now = new Date();
          const day = now.getDate().toString().padStart(2, '0');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = monthNames[now.getMonth()];
          const year = now.getFullYear();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}`;

          const challanInfo = {
            vendorCode: "Squarebox",
            offenceDtTime: formattedDateTime, // Correct format: DD-MMM-YYYY HH:MM
            vioData: vioDataArray, // Must be an array of violation codes
            capturedByCD: finalOfficerInfo.operatorCd,
            operatorCD: finalOfficerInfo.operatorCd,
            vehRemak: "N",
            gpsLatti: (activeChallana as any)?.gpsLatti || "17.41565980",
            gpsLong: (activeChallana as any)?.gpsLong || "78.41276220",
            gpsLocation: (activeChallana as any)?.gpsLocation || "Apollo Emergency Rd, Telangana 500096",
            vehicleNo: (activeChallana as any)?.modified_vehicle_details?.registrationNumber ||
                      (activeChallana as any)?.parameter_analysis?.rta_data_used?.registrationNumber ||
                      (activeChallana as any)?.license_plate_number ||
                      activeChallana?.plateNumber,
            pointCD: finalOfficerInfo.operatorCd.slice(0, 6), // Extract point code from operator CD
            appName: "SQBX"
          };
          formData.append('challanInfo', JSON.stringify(challanInfo));

          // Call the correct endpoint with FormData
          fetch(`${backendUrl}/api/generate-challan`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${operatorToken}`
            },
            body: formData
          }).then(async (response) => {
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Challan generation completed:', result);
              showSuccessToast({
                heading: "Challan Generated",
                description: "Challan has been successfully generated with image file.",
                placement: "top-right",
              });
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error('❌ Challan generation failed:', errorData);
              showErrorToast({
                heading: "Generation Failed",
                description: errorData.error || "Challan generation failed. Please try again.",
                placement: "top-right",
              });
            }
          }).catch(error => {
            console.error('❌ Background challan generation error:', error);
            showErrorToast({
              heading: "Generation Error",
              description: "Failed to generate challan. Please check your connection and try again.",
              placement: "top-right",
            });
          });
        } catch (imageError) {
          console.error('❌ Failed to fetch image for challan generation:', imageError);
          showErrorToast({
            heading: "Image Error",
            description: "Failed to load image for challan generation. Please try again.",
            placement: "top-right",
          });
        }
      }

      // STEP 3: Immediately move to generated section (UI feedback)
      showSuccessToast({
        heading: "Challan Queued",
        description: "Challan has been queued for generation and moved to Generated section.",
        placement: "top-right",
      });

      // Auto-move to next challan
      if (currentIndex < pendingReviews.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextChallan = pendingReviews[nextIndex];
        setCurrentIndex(nextIndex);
        
        setActiveChallana(nextChallan);
      }

      // Remove from pending reviews
      const newPendingReviews = pendingReviews?.filter(
        (item) => item.id !== activeChallana?.id
      );
      setPendingReviews(newPendingReviews);
      setShowGenerateConfirmation(false);

    } catch (error: any) {
      console.error('❌ Challan preparation error:', error);
      showErrorToast({
        heading: "Generation Failed",
        description: error.message || "Failed to queue challan. Please try again.",
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

  const handleDuplicateAnalysis = async () => {
    try {
      setButtonLoader(true);
      const response = await apiService.duplicateAnalysis(
        (activeChallana as any)?.uuid || activeChallana?.id || "",
        duplicateLicensePlate,
        duplicateReason
      );

      if (response.success && response.data) {
        const nextChallanIndex = currentIndex + 1;
        
        // Add the new challan to the list right after the current one
        const newChallan = response.data;
        const updatedPendingReviews = [...pendingReviews];
        updatedPendingReviews.splice(currentIndex + 1, 0, newChallan);
        setPendingReviews(updatedPendingReviews);
        
        showSuccessToast({
          heading: "Success",
          description: "Another vehicle ticket created successfully",
          placement: "top-right",
        });
        
        // Close modal and clear form
        setShowDuplicateModal(false);
        setDuplicateLicensePlate("");
        setDuplicateReason("");
        
        // Navigate to the new challan
        setCurrentIndex(nextChallanIndex);
        setActiveChallana(newChallan);
        
        // Start preloading for the new position
        setTimeout(() => maintainRollingCache(nextChallanIndex, updatedPendingReviews), 100);
      }
    } catch (error: any) {
      showErrorToast({
        heading: "Error",
        description: error.message || "Failed to create vehicle ticket",
        placement: "top-right",
      });
    } finally {
      setButtonLoader(false);
    }
  };

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
          variant={"secondary"}
          onClick={() => setShowDuplicateModal(true)}
          disabled={buttonLoader}
        >
          <ClipboardList />
          <span className="flex items-center gap-1">
            Add Another Vehicle
            <span className="text-xs bg-purple-100 text-purple-800 rounded-full px-1.5 py-0.5">Beta</span>
          </span>
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


      {/* Duplicate Analysis Modal */}
      <Modal
        open={showDuplicateModal}
        onOpenChange={(o) => {
          if (!o) {
            setShowDuplicateModal(false);
            setDuplicateLicensePlate("");
            setDuplicateReason("");
          }
        }}
        title="Add Another Vehicle"
        size="md"
        description="Add another vehicle found in this same image"
        children={
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">License Plate Number</label>
              <input
                type="text"
                value={duplicateLicensePlate}
                onChange={(e) => setDuplicateLicensePlate(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter license plate number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reason (Optional)</label>
              <textarea
                value={duplicateReason}
                onChange={(e) => setDuplicateReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter reason for adding another vehicle"
                rows={3}
              />
            </div>
          </div>
        }
        footer={
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDuplicateModal(false);
                setDuplicateLicensePlate("");
                setDuplicateReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!duplicateLicensePlate.trim() || buttonLoader}
              onClick={handleDuplicateAnalysis}
            >
              {buttonLoader ? "Creating..." : "Create Ticket"}
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
              {buttonLoader ? "Processing..." : "Confirm & Generate"}
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
