import { BACKEND_URL } from "@/constants/globalConstants";

// Types for Step-by-Step Analysis Responses
export interface StepResponse {
  success: boolean;
  step: number;
  step_name: string;
  data?: any;
  error?: string;
  errorCode?: string;
}

// NEW: Updated structure for the new backend analysis methods
export interface StepAnalysisResponse {
  success: boolean;
  step: number;
  step_name: string;
  timestamp: string;
  results: {
    step1?: StepResponse;
    step2?: StepResponse;
    step3?: StepResponse;
    step4?: StepResponse;
    step5?: StepResponse;
    step6?: StepResponse;
  };
  recommendation: string;
  next_steps: string[];
  error?: string;
  errorCode?: string;
}

// LEGACY: Old workflow structure for backward compatibility
export interface WorkflowResponse {
  success: boolean;
  workflow_name: string;
  timestamp: string;
  steps: StepResponse[];
  summary?: {
    quality_category: string;
    suitable_for_analysis: boolean;
    license_plate_extracted: boolean;
    license_plate: string | null;
    rta_data_found: boolean;
    rta_data: any;
    vehicle_analysis_completed: boolean;
    vehicle_analysis: any;
    comparison_completed: boolean;
    comparison_result: any;
    violation_detection_completed: boolean;
    violation_analysis: any;
    violations_found: number;
    violation_types: string[];
    next_step_recommendation: any;
  };
}

// Enhanced Quality Assessment Types (NEW)
export interface QualityAssessmentData {
  quality_category: "GOOD" | "NEEDS_BETTER_REVIEW" | "BLURRY_NOT_FIT";
  confidence: number;
  reasoning: string;
  suitable_for_analysis: boolean;
  license_plate_extractable: boolean;
  extracted_license_plate?: string;
  extraction_confidence?: number;
  format_validation_failed?: boolean;
}

// Enhanced OCR Types (NEW)
export interface OCRData {
  license_plate: string | null;
  confidence: number;
  extraction_method: string;
  telangana_format_validated: boolean;
  format_valid: boolean;
  extraction_possible: boolean;
  source?: string;
}

// Violation Detection Types
export interface ViolationDetection {
  violation_type:
    | "No Helmet"
    | "Cell Phone Driving"
    | "Triple Riding"
    | "Wrong Side Driving";
  detected: boolean;
  confidence: number;
  description: string;
  reasoning: string;
  severity: "High" | "Medium" | "Low";
}

export interface ViolationAnalysis {
  violations_detected: ViolationDetection[];
  overall_assessment: {
    total_violations: number;
    violation_summary: string;
    image_clarity_for_detection: string;
    analysis_confidence: number;
  };
  enforcement_recommendation: {
    action: "ISSUE_CHALLAN" | "REVIEW_REQUIRED" | "NO_ACTION";
    priority: "High" | "Medium" | "Low";
    notes: string;
  };
  detected_violation_count: number;
  violation_types_found: string[];
}

// Vehicle Comparison Types
export interface VehicleComparison {
  overall_verdict: "MATCH" | "PARTIAL_MATCH" | "MISMATCH";
  confidence_score: number;
  parameter_analysis: {
    color: {
      ai_value: string;
      rta_value: string;
      match_status: "MATCH" | "PARTIAL" | "MISMATCH";
      reasoning: string;
    };
    make: {
      ai_value: string;
      rta_value: string;
      match_status: "MATCH" | "PARTIAL" | "MISMATCH";
      reasoning: string;
    };
    model: {
      ai_value: string;
      rta_value: string;
      match_status: "MATCH" | "PARTIAL" | "MISMATCH";
      reasoning: string;
    };
    vehicle_type: {
      ai_value: string;
      rta_value: string;
      match_status: "MATCH" | "PARTIAL" | "MISMATCH";
      reasoning: string;
    };
  };
  discrepancies: string[];
  explanation: string;
  verification_recommendation: "APPROVE" | "REVIEW" | "REJECT";
}

// Legacy types for backward compatibility
export interface GeminiVehicleDetails {
  vehicle_type: string;
  wheel_category: string;
  color: string;
  make: string;
  model: string;
  number_plate: {
    text: string;
    confidence: {
      score: string;
      reason: string;
    };
  };
  confidence_scores: {
    color: {
      score: string;
      reason: string;
    };
    make: {
      score: string;
      reason: string;
    };
    model: {
      score: string;
      reason: string;
    };
  };
}

export interface GeminiViolation {
  type: string;
  probability: string;
  reason: string;
}

export interface RTAVerification {
  registration_number: string;
  status: string;
  matches: boolean;
  confidence_scores: {
    make: number;
    model: number;
    color: number;
  };
  overall_score: number;
}

export interface GeminiAnalysisResponse {
  success: boolean;
  gemini_analysis: {
    vehicle_details: GeminiVehicleDetails;
    violations: GeminiViolation[];
  };
  rta_verification: RTAVerification | null;
  timestamp: string;
  error?: string;
  errorCode?: string;
}

export interface BackendHealthResponse {
  status: string;
  timestamp: string;
  service: string;
  tsechallan_configured: boolean;
  gemini_configured: boolean;
  google_cloud_vision_configured: boolean;
  rta_data_loaded: number;
  implementation_status: {
    step_1_quality_assessment: string;
    step_2_license_plate_ocr: string;
    step_3_rta_lookup: string;
    step_4_vehicle_analysis: string;
    step_5_details_comparison: string;
    step_6_violation_detection: string;
  };
  endpoints: {
    step6_complete_workflow: string;
    step5_complete_workflow: string;
    step4_complete_workflow: string;
    step3_complete_workflow: string;
    step2_workflow: string;
    violation_detection: string;
    vehicle_comparison: string;
    vehicle_analysis: string;
    rta_details_lookup: string;
    image_quality_assessment: string;
    license_plate_ocr: string;
    [key: string]: string;
  };
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BACKEND_URL;
  }

  // Test backend connectivity
  async testBackendHealth(): Promise<BackendHealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    return response.json();
  }

  // NEW: Step 6 Complete Analysis - Returns new structure
  async analyzeImageStep6(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${this.baseUrl}/api/step6-analysis`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Step 6 analysis failed: ${response.status}`
      );
    }

    const jsonResponse = await response.json();

    return jsonResponse;
  }

  // TEST METHOD: Uses hardcoded successful response
  async testAnalyzeImageStep6(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${this.baseUrl}/api/test-step6-analysis`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Test Step 6 analysis failed: ${response.status}`
      );
    }

    return response.json();
  }

  // NEW: Step 5 Complete Analysis - Returns new structure
  async analyzeImageStep5(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${this.baseUrl}/api/step5-analysis`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Step 5 analysis failed: ${response.status}`
      );
    }

    return response.json();
  }

  // NEW: Step 4 Complete Analysis - Returns new structure
  async analyzeImageStep4(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${this.baseUrl}/api/step4-analysis`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Step 4 analysis failed: ${response.status}`
      );
    }

    return response.json();
  }

  // NEW: Step 3 Complete Analysis - Returns new structure
  async analyzeImageStep3(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${this.baseUrl}/api/step3-analysis`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Step 3 analysis failed: ${response.status}`
      );
    }

    return response.json();
  }

  // NEW: Step 2 Complete Analysis - Returns new structure
  async analyzeImageStep2(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${this.baseUrl}/api/step2-analysis`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Step 2 analysis failed: ${response.status}`
      );
    }

    return response.json();
  }

  // Individual Step Operations
  async assessImageQuality(imageFile: File): Promise<StepResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${this.baseUrl}/api/assess-image-quality`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Quality assessment failed: ${response.status}`
      );
    }

    return response.json();
  }

  async extractLicensePlate(
    imageFile: File,
    qualityCategory?: string
  ): Promise<StepResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (qualityCategory) {
      formData.append("quality_category", qualityCategory);
    }

    const response = await fetch(`${this.baseUrl}/api/extract-license-plate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `License plate extraction failed: ${response.status}`
      );
    }

    return response.json();
  }

  async fetchRTADetails(licensePlate: string): Promise<StepResponse> {
    const response = await fetch(`${this.baseUrl}/api/fetch-rta-details`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ license_plate: licensePlate }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `RTA lookup failed: ${response.status}`
      );
    }

    return response.json();
  }

  async analyzeVehicleDetails(
    imageFile: File,
    qualityCategory?: string
  ): Promise<StepResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (qualityCategory) {
      formData.append("quality_category", qualityCategory);
    }

    const response = await fetch(
      `${this.baseUrl}/api/analyze-vehicle-details`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Vehicle analysis failed: ${response.status}`
      );
    }

    return response.json();
  }

  async compareVehicleDetails(
    aiAnalysis: any,
    rtaData: any
  ): Promise<StepResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/compare-vehicle-details`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aiAnalysis, rtaData }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Vehicle comparison failed: ${response.status}`
      );
    }

    return response.json();
  }

  async reAnalyzeWithCorrectedPlate(
    imageFile: File,
    correctedPlateNumber: string
  ): Promise<StepAnalysisResponse> {
    console.log(
      "🔄 Re-analyzing with corrected license plate:",
      correctedPlateNumber
    );

    try {
      // Use the new focused re-analysis endpoint
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append(
        "corrected_license_plate",
        correctedPlateNumber.trim().toUpperCase()
      );

      console.log("📡 Calling focused re-analysis endpoint...");
      const response = await fetch(
        `${this.baseUrl}/api/reanalyze-with-corrected-plate`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Re-analysis failed: ${response.status}`
        );
      }

      const stepAnalysisResponse = await response.json();
      console.log("✅ Focused re-analysis completed successfully");
      console.log("📋 Response success:", stepAnalysisResponse.success);
      console.log("📋 Corrected plate:", correctedPlateNumber);

      return stepAnalysisResponse;
    } catch (error) {
      console.error("Failed to re-analyze with corrected plate:", error);
      throw new Error(
        `Re-analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async reAnalyzeWithCorrectedPlateS3(
    s3Url: string,
    correctedPlateNumber: string,
    uuid?: string
  ): Promise<StepAnalysisResponse> {
    try {
      // Use the S3-based re-analysis endpoint
      const requestBody = {
        s3_url: s3Url,
        corrected_license_plate: correctedPlateNumber.trim().toUpperCase(),
        uuid: uuid || null,
      };

      console.log("📡 Calling S3-based re-analysis endpoint...");
      console.log("📋 Request body:", requestBody);

      const response = await fetch(
        `${this.baseUrl}/api/reanalyze-with-s3-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ S3 Re-analysis failed with response:", errorData);
        throw new Error(
          errorData.error || `S3 Re-analysis failed: ${response.status}`
        );
      }

      const stepAnalysisResponse = await response.json();
      console.log("✅ S3-based re-analysis completed successfully");
      return stepAnalysisResponse;
    } catch (error) {
      console.error("❌ S3 Re-analysis with corrected plate failed:", error);
      throw error;
    }
  }

  async detectViolations(
    imageFile: File,
    qualityCategory?: string,
    vehicleAnalysis?: any
  ): Promise<StepResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (qualityCategory) {
      formData.append("quality_category", qualityCategory);
    }
    if (vehicleAnalysis) {
      formData.append("vehicle_analysis", JSON.stringify(vehicleAnalysis));
    }

    const response = await fetch(`${this.baseUrl}/api/detect-violations`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Violation detection failed: ${response.status}`
      );
    }

    return response.json();
  }

  // Legacy method for backward compatibility
  async analyzeImage(imageFile: File): Promise<GeminiAnalysisResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${this.baseUrl}/api/analyze-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Image analysis failed: ${response.status}`
      );
    }

    return response.json();
  }

  // Test Gemini API configuration
  async testGeminiConnection(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/test-gemini`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Gemini test failed: ${response.status}`);
    }
    return response.json();
  }

  // Get vehicle details from TSeChallan (legacy method)
  async getVehicleDetails(registrationNumber: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/vehicle-details`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ registrationNumber }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Vehicle lookup failed: ${response.status}`
      );
    }

    return response.json();
  }

  // Get previous challans for a vehicle using backend API
  async getPreviousChallans(registrationNumber: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log("🔍 Fetching previous challans for:", registrationNumber);
      
      const response = await fetch(`${this.baseUrl}/api/vehicle-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber }),
      });

      console.log("📥 Backend API Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Backend API Error:", errorData);
        return {
          success: false,
          error: errorData.error || `Failed to fetch previous challans: ${response.status}`
        };
      }

      const data = await response.json();
      console.log("📄 Backend API Response Data:", data);
      
      if (data.success && data.data) {
        console.log("✅ Successfully retrieved vehicle data:", {
          vehicleNumber: data.data.registrationNumber,
          make: data.data.make,
          model: data.data.model,
          color: data.data.color,
          rcStatus: data.data.rcStatus
        });
        
        // Transform RTA data format to match UI expectations
        const transformedData = {
          responseCode: "0",
          responseDesc: "Success",
          data: {
            regnNo: data.data.registrationNumber,
            color: data.data.color,
            wheeler: "4", // Default since RTA doesn't provide this
            maker: data.data.make,
            model: data.data.model,
            vehtype: data.data.model, // Use model as vehicle type
            imageURLs: [] // RTA data doesn't include previous challan images
          }
        };
        
        return {
          success: true,
          data: transformedData
        };
      } else {
        console.log("⚠️ Backend API returned non-success:", data);
        return {
          success: false,
          error: data.error || "No vehicle data found"
        };
      }

    } catch (error) {
      console.error("💥 Failed to fetch previous challans:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch previous challans"
      };
    }
  }

  // Get RTA sample data
  async getRTAData(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/rta-data`);
    if (!response.ok) {
      throw new Error(`RTA data fetch failed: ${response.status}`);
    }
    return response.json();
  }

  // Violations API methods
  async getViolations() {
    const response = await fetch(`${BACKEND_URL}/api/violations`);
    return response.json();
  }

   // Violations API methods
  async getDatabaseViolations() {
    const response = await fetch(`${BACKEND_URL}/api/database/violations`);
    return response.json();
  }

  async getViolationsByVehicleType(vehicleType: string) {
    const response = await fetch(
      `${BACKEND_URL}/api/violations/vehicle/${encodeURIComponent(vehicleType)}`
    );
    return response.json();
  }

  async calculateFine(violationNames: string[], vehicleType: string) {
    const response = await fetch(
      `${BACKEND_URL}/api/violations/calculate-fine`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          violationNames,
          vehicleType,
        }),
      }
    );
    return response.json();
  }

  // Queue Management API methods
  async getQueueStatus() {
    const response = await fetch(`${BACKEND_URL}/api/queue/status`);
    return response.json();
  }

  async pauseQueue() {
    const response = await fetch(`${BACKEND_URL}/api/queue/pause`, {
      method: "POST",
    });
    return response.json();
  }

  async resumeQueue() {
    const response = await fetch(`${BACKEND_URL}/api/queue/resume`, {
      method: "POST",
    });
    return response.json();
  }

  async clearQueue() {
    const response = await fetch(`${BACKEND_URL}/api/queue/clear`, {
      method: "DELETE",
    });
    return response.json();
  }

  // S3 Monitoring API methods
  async startS3Monitoring() {
    const response = await fetch(`${BACKEND_URL}/api/s3/monitoring/start`, {
      method: "POST",
    });
    return response.json();
  }

  async stopS3Monitoring() {
    const response = await fetch(`${BACKEND_URL}/api/s3/monitoring/stop`, {
      method: "POST",
    });
    return response.json();
  }

  async getS3MonitoringStatus() {
    const response = await fetch(`${BACKEND_URL}/api/s3/monitoring/status`);
    return response.json();
  }

  async getRecentS3Images(limit: number = 20) {
    const response = await fetch(
      `${BACKEND_URL}/api/s3/recent-images?limit=${limit}`
    );
    return response.json();
  }

  async checkS3Now() {
    const response = await fetch(`${BACKEND_URL}/api/s3/check-now`, {
      method: "POST",
    });
    return response.json();
  }

  // CRITICAL: Missing database fetch methods
  async getRecentAnalyses(limit = 50, offset = 0) {
    const response = await fetch(
      `${BACKEND_URL}/api/analyses?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAnalysisById(uuid: string) {
    const response = await fetch(`${BACKEND_URL}/api/analysis/${uuid}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Generate presigned URL for direct S3 upload (EXACT copy of Lambda function)
  async generatePresignedUrl(constableId: string = "unknown") {
    const response = await fetch(`${BACKEND_URL}/api/generate-presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ constable_id: constableId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Lambda returns: { upload_url, key, expires_in }
    return {
      success: true,
      data: {
        uploadUrl: data.upload_url, // Convert to camelCase for frontend
        key: data.key,
        expiresIn: data.expires_in,
      },
    };
  }

  // Upload image directly to S3 using presigned URL
  async uploadImageToS3(imageFile: File, presignedUrl: string) {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: imageFile,
      headers: {
        "Content-Type": "image/jpeg",
      },
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed! status: ${response.status}`);
    }

    return { success: true, uploaded: true };
  }

  // NEW: Upload to S3 and let backend auto-detect (same as Android app flow)
  async uploadImageForAutoAnalysis(
    imageFile: File,
    officerId: string = "unknown"
  ): Promise<StepAnalysisResponse> {
    console.log("🔐 Starting presigned URL upload flow...");

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await this.generatePresignedUrl(officerId);

      if (!presignedResponse.success) {
        throw new Error("Failed to get presigned URL");
      }

      console.log(`📤 Uploading to S3: ${presignedResponse.data.key}`);

      // Step 2: Upload directly to S3
      await this.uploadImageToS3(imageFile, presignedResponse.data.uploadUrl);

      console.log("✅ Image uploaded to S3 successfully");
      console.log("🔍 Backend will auto-detect and analyze this image");

      // Return success response (analysis will happen automatically)
      return {
        success: true,
        step: 0,
        step_name: "S3 Upload Complete",
        timestamp: new Date().toISOString(),
        results: {},
        recommendation: "Backend will auto-detect and analyze",
        next_steps: ["Wait for backend processing"],
        workflow: "S3 Upload Complete - Auto-Analysis Pending",
        message:
          "Image uploaded to S3 successfully. Backend will detect and analyze automatically.",
        s3Upload: {
          uploaded: true,
          key: presignedResponse.data.key,
          bucket: "traffic-violations-uploads-111",
        },
        note: "Results will appear in UI after backend processing (~1-2 minutes)",
      } as StepAnalysisResponse;
    } catch (error) {
      console.error("❌ Presigned URL upload failed:", error);
      throw error;
    }
  }

  // CRITICAL: Officer review APIs for database integration
  async submitOfficerReview(
    uuid: string,
    officerId: string,
    action: "approved" | "rejected" | "modified",
    reason?: string
  ) {
    const requestBody = {
      uuid,
      officerId,
      action,
      reason,
    };

    const response = await fetch(`${BACKEND_URL}/api/officer-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return result;
  }

  async getPendingReviews(limit = 50, offset = 0) {
    const response = await fetch(
      `${BACKEND_URL}/api/pending-reviews?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getReviewedAnalyses(limit = 50, offset = 0) {
    const response = await fetch(
      `${BACKEND_URL}/api/reviewed-analyses?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get presigned URL for image access
  async getImagePresignedUrl(uuid: string) {
    const response = await fetch(
      `${BACKEND_URL}/api/image/${uuid}/presigned-url`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return result;
  }

  // Test S3 object existence
  async testS3Object(uuid: string) {
    const response = await fetch(`${BACKEND_URL}/api/image/${uuid}/test-s3`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return result;
  }

  // Debug S3 configuration
  async debugS3Config() {
    const response = await fetch(`${BACKEND_URL}/api/debug/s3-config`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return result;
  }

  // OTP Authentication - TSeChallan Based (using operatorCD and password)
  async sendOtpToMobile(operatorCD: string, password: string, idCode: number = 1) {
    const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorCD, password, idCode })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.responseDesc || `OTP send failed: ${response.status}`);
    }
    return data;
  }

  async verifyOtpForMobile(operatorCD: string, otp: string) {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorCD, otp })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.responseDesc || `OTP verify failed: ${response.status}`);
    }
    return data as { success: boolean; operatorProfile: any; operatorToken: string; appSessionToken: string };
  }

  // Legacy OTP Authentication (kept for backward compatibility)
  async sendOtpLogin(operatorCD: string, password: string, idCode: number = 1) {
    const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorCD, password, idCode })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.responseDesc || `OTP send failed: ${response.status}`);
    }
    return data;
  }

  async verifyOtpLogin(operatorCD: string, otp: string) {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorCD, otp })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.responseDesc || `OTP verify failed: ${response.status}`);
    }
    return data as { success: boolean; operatorProfile: any; operatorToken: string; appSessionToken: string };
  }

  // Challan Generation API
  async generateChallan(
    challanData: any,
    imageFile: File,
    videoFile?: File,
    operatorToken?: string
  ): Promise<{ success: boolean; data?: any; challanNumber?: string; message?: string; error?: string }> {
    try {
      console.log('🚔 Generating challan with TSeChallan API...');

      // Prepare FormData
      const formData = new FormData();
      formData.append('image', imageFile);

      if (videoFile) {
        formData.append('video', videoFile);
      }

      // Add challan data as JSON string
      formData.append('data', JSON.stringify(challanData));

      // Prepare headers with operator token
      const headers: Record<string, string> = {};
      if (operatorToken) {
        headers['Authorization'] = `Bearer ${operatorToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/generate-challan`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Challan generation failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Challan generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Duplicate Analysis API
  async duplicateAnalysis(originalAnalysisUuid: string, manualLicensePlate: string, modificationReason?: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/challan/duplicate-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalAnalysisUuid,
          manualLicensePlate,
          modificationReason
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Duplicate analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Duplicate analysis error:', error);
      throw error;
    }
  }

  /**
   * Creates a duplicate analysis with a manually corrected license plate
   * @param originalAnalysisUuid - UUID of the original analysis to duplicate
   * @param manualLicensePlate - The corrected license plate number
   * @param modificationReason - Optional reason for creating the duplicate
   */
  async duplicateAnalysis(
    originalAnalysisUuid: string,
    manualLicensePlate: string,
    modificationReason?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log("🔄 Creating duplicate analysis:", {
        originalAnalysisUuid,
        manualLicensePlate,
        modificationReason
      });

      const response = await fetch(`${this.baseUrl}/api/challan/duplicate-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalAnalysisUuid,
          manualLicensePlate: manualLicensePlate.toUpperCase(),
          ...(modificationReason && { modificationReason })
        })
      });

      console.log("📥 Duplicate Analysis Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Duplicate Analysis Error:", errorData);
        return {
          success: false,
          error: errorData.error || `Failed to create duplicate analysis: ${response.status}`
        };
      }

      const data = await response.json();
      console.log("✅ Duplicate Analysis Created:", data);
      
      return {
        success: true,
        data: data.data
      };

    } catch (error) {
      console.error("💥 Failed to create duplicate analysis:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create duplicate analysis"
      };
    }
  }
}

export const apiService = new ApiService();
