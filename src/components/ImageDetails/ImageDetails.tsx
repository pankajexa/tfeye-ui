import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChallanCard from "./ChallanCard";
import { Button } from "../ui/button";
import { Modal } from "../../components/ui/modal";
import { useToast } from "@/components/toast";
import { Challan } from "@/types";
import { apiService } from "@/services/api";
import { BACKEND_URL } from "@/constants/globalConstants";

interface ViolationType {
  id: string | number;
  violation_description: string;
  offence_cd?: string | number;
  wheeler_cd?: string | number;
}

interface ImageDetailsProps {
  pendingChallans: Challan[];
  setShowRejectOptions: (show: boolean) => void;
  showRejectOptions: boolean;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  activeChallana: Challan | null;
  setActiveChallana: (challan: Challan | null) => void;
  handleUpdateChallan: (challanId: any, value: any, type: any) => void;
  allViolationData: ViolationType[];
  setAllViolationData: (violations: ViolationType[]) => void;
}


const rejectionReasons = [
  { id: "Poor image quality", name: "Poor image quality" },
  { id: "Number plate not visible", name: "Number plate not visible" },
  { id: "No Violation in the image", name: "No Violation in the image" },
  { id: "AI Analysis Error", name: "AI Analysis Error" },
  { id: "Fake Number Plate", name: "Fake Number Plate" },
  { id: "Other", name: "Other" },
];

const ImageDetails = ({
  pendingChallans,
  setShowRejectOptions,
  showRejectOptions,
  currentIndex,
  setCurrentIndex,
  activeChallana,
  setActiveChallana,
  handleUpdateChallan,
  allViolationData,
  setAllViolationData,
  setPendingReviews,
  setViolations,
  violations,
}) => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [rejectionReason, setRejectionReason] = useState(
    rejectionReasons?.[0]?.id
  );


  const handleNext = () => {
    if (currentIndex < pendingChallans.length - 1) {
      const newIndex = currentIndex + 1;
      setActiveChallana(pendingChallans[newIndex]);
      setCurrentIndex(newIndex);
      
      // Maintain rolling cache of next 5 images
      setTimeout(() => {
        const urlCache = window.challanUrlCache || (window.challanUrlCache = new Map());
        
        // Preload next 5 from current position
        for (let i = newIndex + 1; i <= Math.min(newIndex + 5, pendingChallans.length - 1); i++) {
          const challan = pendingChallans[i];
          if (challan?.uuid && !urlCache.has(challan.uuid)) {
            apiService.getImagePresignedUrl(challan.uuid).then(response => {
              if (response?.success && response?.presignedUrl) {
                urlCache.set(challan.uuid, response.presignedUrl);
              }
            }).catch(err => console.error("Preload failed:", challan.id));
          }
        }
      }, 0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setActiveChallana(pendingChallans[newIndex]);
      
      // Maintain rolling cache of next 5 images from new position
      setTimeout(() => {
        const urlCache = window.challanUrlCache || (window.challanUrlCache = new Map());
        
        // Preload next 5 from current position (even when going backwards)
        for (let i = newIndex + 1; i <= Math.min(newIndex + 5, pendingChallans.length - 1); i++) {
          const challan = pendingChallans[i];
          if (challan?.uuid && !urlCache.has(challan.uuid)) {
            apiService.getImagePresignedUrl(challan.uuid).then(response => {
              if (response?.success && response?.presignedUrl) {
                urlCache.set(challan.uuid, response.presignedUrl);
              }
            }).catch(err => console.error("Preload failed:", challan.id));
          }
        }
      }, 0);
    }
  };

  const handleUpdateData = (value, type) => {
    handleUpdateChallan(activeChallana?.uuid, value, type);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showErrorToast({
        heading: "Rejection Failed",
        description: "Please provide a reason before rejecting the challan.",
        placement: "top-right",
      });
      return;
    }

    try {
      const requestBody = {
        uuid: activeChallana?.uuid,
        officerId: "System",
        action: "rejected",
        reason: rejectionReason,
      };

      const response = await fetch(`${BACKEND_URL}/api/officer-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showErrorToast({
          heading: "Server Error",
          description: `Failed to reject challan. (${response.status}: ${errorText})`,
          placement: "top-right",
        });
        return;
      }

      const result = await response.json();
      const newPendingReviews = pendingChallans?.filter(
        (item) => item.id !== activeChallana?.id
      );

      showSuccessToast({
        heading: "Challan Rejected",
        description: `Challan with plate ${
          activeChallana?.plateNumber || ""
        } has been rejected successfully.`,
        placement: "top-right",
      });

      setShowRejectOptions(false);
      setRejectionReason("");

      // Auto-move to next challan after rejection
      if (currentIndex < pendingChallans.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setActiveChallana(pendingChallans[currentIndex + 1]);
      }
      setPendingReviews(newPendingReviews);
    } catch (error: any) {
      showErrorToast({
        heading: "Unexpected Error",
        description:
          error.message || "Something went wrong while rejecting the challan.",
        placement: "top-right",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Challan {activeChallana?.id}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} of {pendingChallans?.length}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              title="Previous"
              variant={"outline"}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              title="Next"
              variant={"outline"}
              onClick={handleNext}
              disabled={currentIndex >= pendingChallans?.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={showRejectOptions}
        onOpenChange={(o) => {
          if (!o) setShowRejectOptions(false);
        }}
        title="Select rejection reason:"
        size="md"
        description=""
        children={
          <div className="space-y-2">
            {rejectionReasons?.map((reason) => (
              <label
                key={reason?.id}
                className="flex cursor-pointer items-center"
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  value={reason?.id}
                  checked={rejectionReason === reason?.id}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {reason?.name}
                </span>
              </label>
            ))}
          </div>
        }
        footer={
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowRejectOptions(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleReject();
              }}
            >
              Confirm Reject
            </Button>
          </div>
        }
      />

      <ChallanCard
        key={`${pendingChallans?.[currentIndex]?.id}-${pendingChallans?.[currentIndex]?.timestamp}`}
        challan={activeChallana}
        onAction={handleUpdateData}
        allViolationData={allViolationData}
        setAllViolationData={setAllViolationData}
        setViolations={setViolations}
        violations={violations}
      />
    </div>
  );
};

export default ImageDetails;
