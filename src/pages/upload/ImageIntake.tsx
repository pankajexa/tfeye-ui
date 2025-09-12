import React, { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { apiService, StepAnalysisResponse } from "../../services/api";
import { useChallanContext } from "../../context/ChallanContext";

interface AnalyzedImage {
  id: string;
  challanId: string;
  file: File;
  preview: string;
  status: "queued" | "analyzing" | "completed" | "error" | "retrying";
  stepAnalysisResponse?: StepAnalysisResponse;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  queuePosition?: number;
  // Simplified status tracking
  detectedPlateNumber?: string;
  violationCount?: number;
  violationTypes?: string[];
  vehicleMatch?: boolean;
  // Upload deduplication
  uploadId?: string;
  uploaded?: boolean;
}

interface QueueStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  currentImage?: string;
  isProcessing: boolean;
  isPaused: boolean;
  // S3 monitoring stats
  s3Monitoring?: {
    isMonitoring: boolean;
    bucket: string;
    lastCheckTime: string;
    isConfigured: boolean;
  };
  s3Images?: {
    queued: number;
    processing: number;
    recentCount: number;
  };
}

// Officer Names List
const OFFICER_NAMES = [
  "D. Narsing Rao",
  "E. Shekar",
  "K. Narasimha Rao",
  "Thammisetti Gopi",
  "A. Satya Narendra",
  "K. Raghuram Reddy",
  "K. Krishnaiah",
  "R. Venkat Kumar",
  "K. Manyapu Reddy",
  "Valdas. Ashok",
  "M. Ramu",
  "D. Dilleswar Rao",
  "P. Srinivas Reddy",
  "R. V. Tirumala Rao",
  "K. Sudhakar",
  "Hemasundararao",
  "M. Swapna Sundari",
  "Sappidivinod",
  "T. Kishore",
  "A. Rakesh Kumar",
  "Mohd Abdur Rahman",
  "M. Chandra Sheker",
  "Mohd Moinuddin Ahmed",
  "K. Srinivas",
  "P. Ramchandra Reddy",
  "Sree Ramulu",
  "J. Raju",
  "T. Venkatesh",
  "R. Praveen",
  "P. Srikanth",
  "A. Srinivas",
  "M. Sai Kumar",
  "M. Kiran Kumar",
  "R. Santosh",
  "K. Eshwar Naik",
  "V. Nageswara Rao",
  "P. Madhubabu",
  "Zakir Hussian",
  "Chandra Sekhar",
  "P. Kiran Kumar",
  "P. Danaiah",
  "G. Prasad",
  "P. Suresh Kumar",
  "D. Kantha Rao",
  "G. Sandeep",
  "R. Sudhakar",
  "K. Shekar",
  "K. Vishnu Vardhan",
  "P. Saikumar",
  "K. Chandra Sekhar Naik",
  "G. Anjandeep Kumar",
  "Md. Moin Pasha",
  "J. Dilipkumar",
  "R. Jaypaul",
  "G. Narsimha Rao",
  "Syed Abdul Azhar",
  "Ranjeeth Naik",
  "T. Balakrishna",
  "K. Vijay Kumar",
  "D. Ajay Kumar",
  "B. Nikhil",
  "Kandepalli Dilip",
  "V. Rajender",
  "D. Shiva Shanker",
  "G. V. S. L. Tejaswini",
  "L. Balachander",
  "Rajesh",
  "B. Kishore Raju",
  "Singotam Naresh",
  "Mohd Mazhar Ali",
  "M. Narender Kumar",
  "A. Rajesh",
  "G. Shanthi",
  "D. Janaki Raghava Rao",
  "S. Sai Divya",
  "P. Prashanthi",
  "C. Rekha",
  "S. Rajitha",
  "Sindhuja",
  "G. Naveen",
  "Vikas Singh",
  "Mohd Azharuddin",
  "T. Rakesh Singh",
  "S. Madhu",
  "B. Mahender",
  "Nitin Singare",
  "G. M. Narender Kumar",
];

// Point Names List
const POINT_NAMES = [
  "Jubilee Hills Check Post",
  "Road No. 65",
  "Chutneys Junction",
  "Peddamma Temple, Pelican Signal",
  "Neeru Junction",
  "BVB Junction",
  "RD No. 45 Junction",
  "Journalist Colony",
  "Venkatagir Junction",
  "Road No. 39/44",
  "Road No. 56",
  "Road No. 58",
  "TV-5 U Turn",
  "HEART CUP",
  "Foot Over Bridge Film Nagar",
  "Swaruchi",
  "Packshi Circle",
  "Apollo Hosp Junction",
  "Daimond House",
  "Rangoli U Turn",
  "Varamaha Lakshmi",
  "Flyover Ending Point",
  "HM TV Junction",
  "CM Residence T Junction",
  "Shaikpet Nala U Turn",
  "Prashansan Nagar",
  "Road No. 51, Steel Bridge",
];

const ImageIntake: React.FC = () => {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [selectedPoint, setSelectedPoint] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [queueStats, setQueueStats] = useState<QueueStats>({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    isProcessing: false,
    isPaused: false,
  });

  const {
    addChallan,
    updateChallanWithStepAnalysis,
    updateChallanStatus,
    rejectChallan,
  } = useChallanContext();

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
    fetchQueueStatus();

    // Set up polling for queue status
    const queueInterval = setInterval(fetchQueueStatus, 5000); // Every 5 seconds

    return () => {
      clearInterval(queueInterval);
    };
  }, []);

  const checkBackendStatus = async () => {
    try {
      await apiService.testBackendHealth();
      setBackendStatus("online");
    } catch (error) {
      setBackendStatus("offline");
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const response = await apiService.getQueueStatus();
      if (response.success) {
        const systemStatus = response.data;
        const queueData = systemStatus.queue;
        const s3Data = systemStatus.s3Monitoring;

        setQueueStats({
          total: queueData.stats.total || 0,
          completed: queueData.stats.completed || 0,
          failed: queueData.stats.failed || 0,
          pending: queueData.stats.queued || 0,
          currentImage: queueData.currentlyProcessing?.fileName,
          isProcessing: queueData.isProcessing || false,
          isPaused: !queueData.isProcessing && queueData.queueLength > 0,
          s3Monitoring: s3Data,
          s3Images: {
            queued:
              queueData.queue?.filter(
                (item: any) =>
                  item.type === "s3_auto" && item.status === "queued"
              ).length || 0,
            processing:
              queueData.currentlyProcessing?.type === "s3_auto" ? 1 : 0,
            recentCount: 0, // Will be updated separately if needed
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch queue status:", error);
    }
  };

  const processingRef = useRef(false);
  const pausedRef = useRef(false);

  // Update pause ref when state changes
  useEffect(() => {
    pausedRef.current = queueStats.isPaused;
  }, [queueStats.isPaused]);

  // Simple queue processing function with duplicate prevention
  const processQueue = useCallback(() => {
    if (processingRef.current) {
      return;
    }

    const processNextImage = async () => {
      if (pausedRef.current || processingRef.current) {
        return;
      }

      processingRef.current = true;
      setQueueStats((prev) => ({ ...prev, isProcessing: true }));

      // Get current images
      setAnalyzedImages((currentImages) => {
        // Find next image to process
        const nextImage = currentImages.find(
          (img) =>
            img.status === "queued" ||
            (img.status === "error" &&
              (img.retryCount || 0) < (img.maxRetries || 3))
        );

        if (!nextImage) {
          // No more images to proces
          processingRef.current = false;
          setQueueStats((prev) => ({
            ...prev,
            isProcessing: false,
            currentImage: undefined,
          }));
          return currentImages;
        }

        // Update current image in stats
        setQueueStats((prev) => ({
          ...prev,
          currentImage: nextImage.file.name,
        }));

        // Process the image
        analyzeImageWithRetry(nextImage)
          .then(() => {
            // Schedule next image processing with a small delay
            setTimeout(() => {
              processingRef.current = false;
              processNextImage();
            }, 1000); // Reduced delay to prevent buildup
          })
          .catch(() => {
            processingRef.current = false;
            // Still try to process next image even if current one failed
            setTimeout(() => {
              processNextImage();
            }, 1000);
          });

        return currentImages;
      });
    };

    processNextImage();
  }, []);

  const analyzeImageWithRetry = async (imageFile: AnalyzedImage) => {
    const currentRetryCount = imageFile.retryCount || 0;
    const maxRetries = imageFile.maxRetries || 3;

    try {
      // Update status to analyzing or retrying
      setAnalyzedImages((prev) =>
        prev.map((img) =>
          img.id === imageFile.id
            ? {
                ...img,
                status: currentRetryCount > 0 ? "retrying" : "analyzing",
              }
            : img
        )
      );

      // Execute analysis
      await analyzeImage(imageFile);
    } catch (error) {

      if (currentRetryCount < maxRetries) {
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, currentRetryCount) * 1000; // 1s, 2s, 4s, 8s...

        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? { ...img, retryCount: currentRetryCount + 1, status: "queued" }
              : img
          )
        );

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        // Max retries reached
        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? {
                  ...img,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Analysis failed after retries",
                }
              : img
          )
        );

        // Update stats
        setQueueStats((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          pending: prev.pending - 1,
        }));

        // Update challan status to rejected with reason
        rejectChallan(
          imageFile.challanId,
          "Analysis failed after retries",
          "System"
        );
      }
    }
  };

  // Auto-process queue when new images are added or when processing is resumed
  useEffect(() => {
    const hasQueuedImages = analyzedImages.some(
      (img) => img.status === "queued"
    );
    if (hasQueuedImages && !queueStats.isProcessing && !queueStats.isPaused) {
      processQueue();
    }
  }, [analyzedImages, queueStats.isProcessing, queueStats.isPaused]); // Removed processQueue from deps

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      processingRef.current = false;
      pausedRef.current = false;
    };
  }, []);

  // Update queue positions only when they actually change to avoid render loops
  useEffect(() => {
    setAnalyzedImages((prev) => {
      const queued = prev.filter((img) => img.status === "queued");
      let anyChanged = false;
      const updated = prev.map((img) => {
        if (img.status !== "queued") {
          return img;
        }
        const newPos = queued.findIndex((q) => q.id === img.id) + 1;
        if (img.queuePosition === newPos) {
          return img;
        }
        anyChanged = true;
        return { ...img, queuePosition: newPos };
      });
      return anyChanged ? updated : prev;
    });
  }, [analyzedImages]);

  const analyzeImage = async (imageFile: AnalyzedImage) => {
    try {
      // CHECK FOR DUPLICATE UPLOADS: Prevent same image from being uploaded multiple times
      if (imageFile.uploaded) {
        // Safe state update with error handling
        try {
          setAnalyzedImages((prev) =>
            prev.map((img) =>
              img.id === imageFile.id
                ? {
                    ...img,
                    status: "completed" as const,
                    stepAnalysisResponse: {
                      success: true,
                      step: 0,
                      step_name: "Duplicate Upload Skipped",
                      timestamp: new Date().toISOString(),
                      results: {},
                      recommendation: "Backend will auto-detect and analyze",
                      next_steps: ["Wait for backend processing"],
                      message:
                        "This image was already uploaded and is being processed by the backend.",
                      s3Upload: {
                        uploaded: true,
                        key: imageFile.uploadId || "unknown",
                        bucket: "traffic-violations-uploads-111",
                      },
                      note: "Backend will detect and analyze this image automatically.",
                    } as StepAnalysisResponse,
                  }
                : img
            )
          );

          // Update challan status to processing
          updateChallanStatus(imageFile.challanId, "processing");

          // Update queue stats
          setQueueStats((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            pending: prev.pending - 1,
          }));
        } catch (stateError) {
          // Continue with processing even if state update fails
        }

        return;
      }

      // Update status to analyzing - safe update
      try {
        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id ? { ...img, status: "analyzing" } : img
          )
        );

        // Update challan status to processing
        updateChallanStatus(imageFile.challanId, "processing");
      } catch (stateError) {
        console.error("❌ Error updating status to analyzing:", stateError);
        throw new Error("Failed to update image status");
      }

      // NEW FLOW: Use presigned URL to upload directly to S3 (same as Android app)

      const stepAnalysisResponse = await apiService.uploadImageForAutoAnalysis(
        imageFile.file,
        "unknown"
      );

      // Mark as uploaded to prevent duplicates - safe update
      try {
        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id ? { ...img, uploaded: true } : img
          )
        );
      } catch (stateError) {
        console.error("❌ Error marking image as uploaded:", stateError);
        // Continue processing even if this update fails
      }

      // CHECK IF THIS IS A PRESIGNED URL UPLOAD RESPONSE (not full analysis)
      const responseData = stepAnalysisResponse as any; // Type cast to access custom properties
      if (
        responseData.s3Upload &&
        responseData.workflow === "S3 Upload Complete - Auto-Analysis Pending"
      ) {
        // Handle successful S3 upload - show success message instead of processing analysis
        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? {
                  ...img,
                  status: "completed" as const,
                  stepAnalysisResponse,
                  detectedPlateNumber: "Upload successful - Analysis pending",
                  violationCount: 0,
                  violationTypes: [],
                  vehicleMatch: undefined,
                }
              : img
          )
        );

        // Update challan status to processing (backend will update when analysis completes)
        updateChallanWithStepAnalysis(
          imageFile.challanId,
          stepAnalysisResponse
        );

        // Update queue stats
        setQueueStats((prev) => ({
          ...prev,
          completed: prev.completed + 1,
          pending: prev.pending - 1,
        }));

        // Auto-remove from local state after 10 seconds (give time to see success message)
        try {
          setTimeout(() => {
            try {
              setAnalyzedImages((prev) =>
                prev.filter((img) => img.id !== imageFile.id)
              );
            } catch (timeoutError) {
              console.error("❌ Error in setTimeout cleanup:", timeoutError);
            }
          }, 10000);
        } catch (setTimeoutError) {
          console.error(
            "❌ Error setting up cleanup timeout:",
            setTimeoutError
          );
        }

        return;
      }

      // If we reach here, it's a full analysis response - continue with normal processing

      // Check Step 1 for various rejection conditions
      const step1Data = stepAnalysisResponse.results.step1?.data;

      // Handle enhanced quality assessment rejections
      if (step1Data?.status === "REJECTED") {
        const rejectionReason =
          step1Data.primary_rejection_reason ||
          "Image quality insufficient for analysis";

        console.log("🚫 ENHANCED: Image rejected due to quality issues");
        console.log("  📋 Rejection reason:", rejectionReason);
        console.log("  📋 Quality score:", step1Data.overall_quality_score);

        // Use simplified rejection reason directly from backend
        const simplifiedError = rejectionReason;

        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? ({
                  ...img,
                  status: "completed" as const,
                  stepAnalysisResponse,
                  error: simplifiedError,
                } as AnalyzedImage)
              : img
          )
        );

        rejectChallan(imageFile.challanId, rejectionReason, "System");

        try {
          setTimeout(() => {
            try {
              setAnalyzedImages((prev) =>
                prev.filter((img) => img.id !== imageFile.id)
              );
            } catch (timeoutError) {
              console.error(
                "❌ Error in rejection cleanup timeout:",
                timeoutError
              );
            }
          }, 5000);
        } catch (setTimeoutError) {
          console.error(
            "❌ Error setting up rejection cleanup timeout:",
            setTimeoutError
          );
        }

        return;
      }

      // Legacy rejection handling for backward compatibility
      if (step1Data?.response_type === "bad_quality") {
        console.log("🚫 Image rejected due to poor quality (legacy)");

        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? ({
                  ...img,
                  status: "completed" as const,
                  stepAnalysisResponse,
                  error: "Image quality too poor for analysis",
                } as AnalyzedImage)
              : img
          )
        );

        rejectChallan(
          imageFile.challanId,
          "Image quality too poor for analysis",
          "System"
        );

        try {
          setTimeout(() => {
            try {
              setAnalyzedImages((prev) =>
                prev.filter((img) => img.id !== imageFile.id)
              );
            } catch (timeoutError) {
              console.error(
                "❌ Error in legacy rejection cleanup timeout:",
                timeoutError
              );
            }
          }, 5000);
        } catch (setTimeoutError) {
          console.error(
            "❌ Error setting up legacy rejection cleanup timeout:",
            setTimeoutError
          );
        }

        return;
      }

      if (step1Data?.response_type === "not_traffic_related") {
        console.log("🚫 Image rejected - not traffic related");

        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? ({
                  ...img,
                  status: "completed" as const,
                  stepAnalysisResponse,
                  error: "Image is not traffic-related",
                } as AnalyzedImage)
              : img
          )
        );

        rejectChallan(
          imageFile.challanId,
          "Image is not traffic-related",
          "System"
        );

        try {
          setTimeout(() => {
            try {
              setAnalyzedImages((prev) =>
                prev.filter((img) => img.id !== imageFile.id)
              );
            } catch (timeoutError) {
              console.error(
                "❌ Error in traffic-related rejection cleanup timeout:",
                timeoutError
              );
            }
          }, 5000);
        } catch (setTimeoutError) {
          console.error(
            "❌ Error setting up traffic-related rejection cleanup timeout:",
            setTimeoutError
          );
        }

        return;
      }

      // Check for vehicle analysis failures - FIXED: Check step6 instead of step4
      const step6DataForVehicleCheck = stepAnalysisResponse.results.step6?.data;

      if (
        step6DataForVehicleCheck &&
        !step6DataForVehicleCheck.vehicles_present
      ) {
        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? ({
                  ...img,
                  status: "completed" as const,
                  stepAnalysisResponse,
                  error: "No vehicles detected in image",
                } as AnalyzedImage)
              : img
          )
        );

        rejectChallan(
          imageFile.challanId,
          "No vehicles detected in image",
          "System"
        );

        setTimeout(() => {
          setAnalyzedImages((prev) =>
            prev.filter((img) => img.id !== imageFile.id)
          );
        }, 5000);

        return;
      }

      // Check for license plate extraction failures
      const step2Data = stepAnalysisResponse.results.step2?.data;
      const step3Data = stepAnalysisResponse.results.step3?.data;
      const step6Data = stepAnalysisResponse.results.step6?.data;

      // Extract violation data early for use in manual review logic
      const violationAnalysis = step6Data?.violation_analysis;
      const violationTypes = violationAnalysis?.violation_types_found || [];
      const violationCount = violationAnalysis?.detected_violation_count || 0;

      // Check multiple sources for license plate
      const licensePlateDetected =
        step1Data?.extracted_license_plate ||
        step2Data?.license_plate ||
        step3Data?.license_plate ||
        step6Data?.license_plate;

      // Check if this is a manual review case (OCR failed but violations detected)
      const requiresManualCorrection =
        step1Data?.requires_manual_correction ||
        step2Data?.requires_manual_correction ||
        step3Data?.requires_manual_correction;

      if (!licensePlateDetected && !requiresManualCorrection) {
        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? ({
                  ...img,
                  status: "completed" as const,
                  stepAnalysisResponse,
                  error: "No license plate detected",
                } as AnalyzedImage)
              : img
          )
        );

        rejectChallan(
          imageFile.challanId,
          "No license plate detected",
          "System"
        );

        setTimeout(() => {
          setAnalyzedImages((prev) =>
            prev.filter((img) => img.id !== imageFile.id)
          );
        }, 5000);

        return;
      }

      // Handle manual review case
      if (!licensePlateDetected && requiresManualCorrection) {
        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? ({
                  ...img,
                  status: "completed" as const,
                  stepAnalysisResponse,
                  detectedPlateNumber: "Manual correction required",
                  violationCount,
                  violationTypes,
                  vehicleMatch: false,
                } as AnalyzedImage)
              : img
          )
        );

        // Still update challan but as pending review for manual correction
        updateChallanWithStepAnalysis(
          imageFile.challanId,
          stepAnalysisResponse
        );

        // Update queue stats
        setQueueStats((prev) => ({
          ...prev,
          completed: prev.completed + 1,
          pending: prev.pending - 1,
        }));

        // Auto-remove from local state after 8 seconds
        try {
          setTimeout(() => {
            try {
              setAnalyzedImages((prev) =>
                prev.filter((img) => img.id !== imageFile.id)
              );
            } catch (timeoutError) {
              console.error("❌ Error in setTimeout cleanup:", timeoutError);
            }
          }, 8000);
        } catch (setTimeoutError) {
          console.error(
            "❌ Error setting up cleanup timeout:",
            setTimeoutError
          );
        }

        return;
      }

      // Extract simplified results for successfully analyzed images
      const results = stepAnalysisResponse.results;
      const step5Data = results.step5?.data;

      // Extract simplified data
      const detectedPlateNumber = licensePlateDetected;
      const vehicleComparison = step5Data?.comparison_result;
      const vehicleMatch = vehicleComparison?.overall_verdict === "MATCH";

      setAnalyzedImages((prev) =>
        prev.map((img) =>
          img.id === imageFile.id
            ? ({
                ...img,
                status: "completed" as const,
                stepAnalysisResponse,
                detectedPlateNumber,
                violationCount,
                violationTypes,
                vehicleMatch,
              } as AnalyzedImage)
            : img
        )
      );

      // Update the challan in context with complete analysis results
      updateChallanWithStepAnalysis(imageFile.challanId, stepAnalysisResponse);

      // Update queue stats
      setQueueStats((prev) => ({
        ...prev,
        completed: prev.completed + 1,
        pending: prev.pending - 1,
      }));

      // Auto-remove from local state after 8 seconds (moved to review queue)
      try {
        setTimeout(() => {
          try {
            setAnalyzedImages((prev) =>
              prev.filter((img) => img.id !== imageFile.id)
            );
          } catch (timeoutError) {
            console.error("❌ Error in success cleanup timeout:", timeoutError);
          }
        }, 8000);
      } catch (setTimeoutError) {}
    } catch (error) {
      console.error("💥 Analysis failed:", error);

      // Safe state update in catch block
      try {
        setAnalyzedImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? {
                  ...img,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Analysis failed",
                }
              : img
          )
        );
      } catch (stateError) {
        console.error("❌ Error updating state in catch block:", stateError);
      }

      // Throw error to be handled by retry logic
      throw error;
    }
  };

  const processFiles = (files: File[]) => {
    const newImages: AnalyzedImage[] = files.map((file, index) => {
      const challanId = addChallan(file); // Add to global context

      return {
        id: Math.random().toString(36).substr(2, 9),
        challanId,
        file,
        preview: URL.createObjectURL(file),
        status: "queued",
        retryCount: 0,
        maxRetries: 3,
        queuePosition: index + 1,
        // Generate unique upload ID for deduplication
        uploadId: `${file.name}-${file.size}-${file.lastModified}`,
        uploaded: false,
      };
    });

    setAnalyzedImages((prev) => [...prev, ...newImages]);

    // Update queue stats
    setQueueStats((prev) => ({
      ...prev,
      total: prev.total + newImages.length,
      pending: prev.pending + newImages.length,
    }));

    // Start queue processing
    processQueue();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      // Validate officer and point selection
      if (!selectedOfficer || !selectedPoint) {
        alert(
          "Please select both Officer Name and Point Name before uploading images."
        );
        return;
      }

      const files = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/jpg"
      );

      if (files.length > 0) {
        processFiles(files);
      }
    },
    [selectedOfficer, selectedPoint]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // Validate officer and point selection
    if (!selectedOfficer || !selectedPoint) {
      alert(
        "Please select both Officer Name and Point Name before uploading images."
      );
      return;
    }

    const files = Array.from(e.target.files);
    processFiles(files);

    // Reset input
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Officer and Point Selection */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Officer Name Dropdown */}
            <div>
              <label
                htmlFor="officer-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Officer Name *
              </label>
              <select
                id="officer-select"
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="">Select Officer Name</option>
                {OFFICER_NAMES.sort().map((officer) => (
                  <option key={officer} value={officer}>
                    {officer}
                  </option>
                ))}
              </select>
            </div>

            {/* Point Name Dropdown */}
            <div>
              <label
                htmlFor="point-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Point Name *
              </label>
              <select
                id="point-select"
                value={selectedPoint}
                onChange={(e) => setSelectedPoint(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="">Select Point Name</option>
                {POINT_NAMES.sort().map((point) => (
                  <option key={point} value={point}>
                    {point}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : backendStatus === "offline" ||
                  !selectedOfficer ||
                  !selectedPoint
                ? "border-gray-200 bg-gray-50 opacity-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {!selectedOfficer || !selectedPoint
                ? "Please select Officer and Point first"
                : "Drop traffic images here or click to browse"}
            </h3>
            <p className="text-gray-500 mb-4">
              {!selectedOfficer || !selectedPoint
                ? "Select both Officer Name and Point Name above before uploading images."
                : "Supports JPG, PNG files. Each image will be analyzed for traffic violations using our AI detection system."}
            </p>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileInput}
              disabled={
                backendStatus === "offline" ||
                !selectedOfficer ||
                !selectedPoint
              }
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors duration-200 ${
                backendStatus === "offline" ||
                !selectedOfficer ||
                !selectedPoint
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              Select Images
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageIntake;
