"use client";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { apiService } from "@/services/api";
import ImageZoom from "@/components/ImageDetails/ImageZoom";
import { Loader } from "@/components";

export type ChallanDetails = {
  id: number;
  uuid: string;
  filename: string;
  license_plate_number: string;
  status: string;
  violations_detected: number;
  s3_url: string;
  s3_key: string;
  created_at: string;
  offence_date: string;
  offence_time: string;
  reviewed?: string;
  review_action?: string;
  review_reason?: string;
  reviewed_by_officer_id?: string;
  reviewed_at?: string;
  violation_types?: string[];
  modified_vehicle_details?: any;
  parameter_analysis?: {
    status?: string;
    rta_data_used?: {
      make?: string;
      color?: string;
      model?: string;
      rcStatus?: string;
      registrationNumber?: string;
      _fullData?: {
        make?: string;
        color?: string;
        model?: string;
        state?: string;
        rcStatus?: string;
        registrationNumber?: string;
      };
    };
    analysis_notes?: string;
    visual_analysis?: {
      color?: string;
      model?: string;
      make_brand?: string;
      visibility?: string;
      vehicle_type?: string;
      occupant_count?: number;
      analysis_confidence?: number;
      distinctive_features?: string;
      license_plate_matches?: boolean;
      license_plate_visible?: boolean;
    };
    comparison_result?: {
      explanation?: string;
      discrepancies?: string[];
      overall_verdict?: string;
      confidence_score?: number;
      verification_recommendation?: string;
      parameter_analysis?: {
        color?: {
          ai?: string;
          rta?: string;
          match_status?: string;
        };
        model?: {
          ai?: string;
          rta?: string;
          match_status?: string;
        };
        make_brand?: {
          ai?: string;
          rta?: string;
          match_status?: string;
        };
        vehicle_type?: {
          ai?: string;
          rta?: string;
          match_status?: string;
        };
      };
    };
    rta_data_available?: boolean;
    target_license_plate?: string;
    target_vehicle_found?: boolean;
  };

  rta_matched?: boolean;
  upload_source?: string;
  vio_data?: any[];
};

interface ViewChallanProps {
  viewDetails: ChallanDetails | null;
  setViewDetails: React.Dispatch<React.SetStateAction<ChallanDetails | null>>;
}

const ViewChallan = ({ viewDetails, setViewDetails }: ViewChallanProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>("");

  const fetchImageUrl = async () => {
    const challanUuid = viewDetails?.uuid;
    if (!challanUuid) return;

    setImageLoading(true);
    setImageError("");
    try {
      const s3Test = await apiService.testS3Object(challanUuid);
      if (!s3Test.success || !s3Test.exists) {
        setImageError("Image not found in S3");
        setImageLoading(false);
        return;
      }
      // Now get presigned URL
      const response = await apiService.getImagePresignedUrl(challanUuid);
      if (response.success) {
        if (response.presignedUrl) {
          setImageUrl(response?.presignedUrl);
        } else if (response?.directUrl) {
          setImageUrl(response?.directUrl);
        } else {
          setImageError("No image URL available");
        }
      } else {
        setImageError("Failed to load image URLs");
      }
    } catch (error) {
      setImageUrl("");
      setImageError("Failed to load image");
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    if (viewDetails !== null) {
      fetchImageUrl();
    }
  }, [viewDetails]);
  const handleCloseModal = () => {
    setViewDetails(null);
  };

  return (
    <Dialog
      open={viewDetails !== null}
      onClose={handleCloseModal}
      className="relative z-10"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-lg transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
            >
              <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                <div className="flex-1 flex flex-col overflow-y-auto p-4">
                  <div className="flex items-start pb-4 justify-between">
                    <DialogTitle className="text-lg font-medium text-gray-900">
                      {viewDetails?.license_plate_number || "Challan"}
                    </DialogTitle>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        type="button"
                        onClick={() => handleCloseModal()}
                        className="relative -m-2 p-2 cursor-pointer text-gray-400 hover:text-gray-500"
                      >
                        <span className="absolute -inset-0.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                      </button>
                    </div>
                  </div>

                  {/* This will now stretch to fill remaining height */}
                  <div className="border rounded-lg flex-1 overflow-hidden">
                    {imageLoading ? (
                      <Loader />
                    ) : (
                      <div className="relative w-full h-full">
                        <ImageZoom
                          src={imageUrl}
                          alt="Traffic violation"
                          plateNumber={viewDetails?.license_plate_number}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ViewChallan;
