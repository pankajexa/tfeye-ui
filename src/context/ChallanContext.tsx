import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { WorkflowResponse, apiService } from "../services/api";
import {
  ViolationAnalysis,
  VehicleComparison,
  VehicleAnalysis,
  WorkflowSummary,
  RTAData,
  StepAnalysisResponse,
  QualityAssessmentData,
  OCRData,
} from "../types";
import { useAuth } from "./AuthContext";

// Enhanced Challan interface that includes Step 6 workflow data
export interface Challan {
  // Common identifiers and timestamps
  uuid?: string; // Backend UUID if available
  id: string;
  originalFile: File;
  preview: string;
  image: string;
  created_at?: string; // Raw created_at from backend if available
  status:
    | "processing"
    | "pending-review"
    | "approved"
    | "rejected"
    | "violation-not-tagged";
  timestamp: string;
  plateNumber?: string;
  violations: string[];
  // Some sources still provide this older field name; keep for compatibility
  violation_types?: string[];
  sectorOfficer: {
    psName: string;
    cadre: string;
    name: string;
  };
  capturedBy: {
    psName: string;
    cadre: string;
    name: string;
  };
  jurisdiction: {
    psName: string;
    pointName: string;
  };
  offenceDateTime: {
    date: string;
    time: string;
  };
  vehicleMatches: Array<{
    field: string;
    rtaData: string;
    aiDetected: string;
    match: boolean;
    confidence?: number;
  }>;
  driverGender: string;
  fakePlate: boolean;
  ownerAddress: string;
  rtaMatched: boolean;

  // New optional fields from newer analysis payloads
  modified_vehicle_details?: {
    make?: string;
    model?: string;
    color?: string;
    vehicle_type?: string;
    rcStatus?: string;
    state?: string;
    registrationNumber?: string;
    _fullData?: any;
  };
  parameter_analysis?: {
    status?: string;
    rta_data_used?: {
      make?: string;
      model?: string;
      color?: string;
      rcStatus?: string;
      state?: string;
      registrationNumber?: string;
      _fullData?: any;
    };
    analysis_notes?: string;
    target_vehicle?: string;
    visual_analysis?: any;
    comparison_result?: {
      explanation?: string;
      discrepancies?: any[];
      overall_verdict?: string;
      confidence_score?: number;
      verification_recommendation?: string;
      parameter_analysis?: Record<
        string,
        {
          ai?: any;
          ai_value?: any;
          rta?: any;
          rta_value?: any;
          match?: boolean;
          match_status?: string;
        }
      >;
    };
  };
  overall_verdict?: string;

  // Enhanced fields for Step 6 implementation
  rtaData?: RTAData;
  rtaApiStatus?: "pending" | "success" | "failed";
  rtaApiError?: string;

  // NEW: Step Analysis Workflow Data
  stepAnalysisResponse?: StepAnalysisResponse;
  qualityAssessment?: QualityAssessmentData;
  ocrData?: OCRData;

  // Step 6 Workflow Data (Legacy - for backward compatibility)
  workflowSummary?: WorkflowSummary;
  violationAnalysis?: ViolationAnalysis;
  vehicleComparison?: VehicleComparison;
  vehicleAnalysisData?: VehicleAnalysis;
  qualityCategory?: string;

  // Legacy support
  vehicleDetails?: {
    make: string;
    model: string;
    color: string;
    vehicleType: string;
    confidence: {
      make: number;
      model: number;
      color: number;
    };
  };
  rtaVerification?: {
    status: string;
    matches: boolean;
    overallScore: number;
    registrationNumber: string;
  };
  geminiAnalysis?: any; // Legacy Gemini response
  reviewedBy?: string;
  reviewTimestamp?: string;
  rejectionReason?: string;
}

interface ChallanContextType {
  challans: Challan[];
  isLoading: boolean;
  error: string | null;
  addChallan: (file: File) => string; // returns challan ID
  updateChallanStatus: (id: string, status: Challan["status"]) => void;
  updateChallanWithStepAnalysis: (
    id: string,
    stepAnalysisResponse: StepAnalysisResponse
  ) => void; // NEW
  updateChallanWithWorkflow: (
    id: string,
    workflowResponse: WorkflowResponse
  ) => void; // Legacy
  updateChallanWithAnalysis: (id: string, analysis: any) => void; // Legacy support
  approveChallan: (id: string, reviewedBy: string) => void;
  rejectChallan: (id: string, reason: string, reviewedBy: string) => void;
  modifyChallan: (id: string, updates: Partial<Challan>) => void;
  getChallansByStatus: (status: Challan["status"]) => Challan[];
  refreshData: () => void;
}

const ChallanContext = createContext<ChallanContextType | undefined>(undefined);

export const useChallanContext = () => {
  const context = useContext(ChallanContext);
  if (!context) {
    throw new Error("useChallanContext must be used within a ChallanProvider");
  }
  return context;
};

interface ChallanProviderProps {
  children: ReactNode;
}

export const ChallanProvider: React.FC<ChallanProviderProps> = ({
  children,
}) => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOfficer, isAuthenticated } = useAuth();

  // Fetch analyses from database when user logs in
  useEffect(() => {
    if (isAuthenticated && currentOfficer) {
      fetchAnalysesFromDatabase();
    } else {
      setChallans([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, currentOfficer]);

  const fetchAnalysesFromDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch recent analyses from database
      const response = await apiService.getRecentAnalyses(100, 0);

      if (response.success) {
        const dbAnalyses = response?.data;
        // Convert database records to Challan format
        const convertedChallans = dbAnalyses.map(convertDbAnalysisToChallan);
        setChallans(convertedChallans);
      } else {
        throw new Error("Failed to fetch analyses from database");
      }
    } catch (error) {
      setError("Failed to load analyses from database");
      setChallans([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert database analysis record to Challan format
  const convertDbAnalysisToChallan = (dbAnalysis: any): Challan => {
    // Parse JSON fields safely
    const parseJsonField = (field: any) => {
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch {
          return {};
        }
      }
      return field || {};
    };

    // Helper function to populate vehicle matches from database
    const populateVehicleMatches = (dbAnalysis: any): any[] => {
      try {
        // First, try to get data from step5_comparison_data JSONB field
        if (dbAnalysis.step5_comparison_data) {
          const step5Data = parseJsonField(dbAnalysis.step5_comparison_data);
          if (step5Data?.parameter_analysis) {
            const analysis = step5Data.parameter_analysis;
            return [
              {
                field: "Make",
                rtaData:
                  analysis.make_brand?.rta ||
                  analysis.make?.rta_value ||
                  analysis.make?.rta ||
                  "Not Available",
                aiDetected:
                  analysis.make_brand?.ai ||
                  analysis.make?.ai_value ||
                  analysis.make?.ai ||
                  "Not Detected",
                match:
                  analysis.make_brand?.match ||
                  analysis.make?.match_status === "MATCH" ||
                  analysis.make?.match ||
                  false,
              },
              {
                field: "Model",
                rtaData:
                  analysis.model?.rta_value ||
                  analysis.model?.rta ||
                  "Not Available",
                aiDetected:
                  analysis.model?.ai_value ||
                  analysis.model?.ai ||
                  "Not Detected",
                match:
                  analysis.model?.match_status === "MATCH" ||
                  analysis.model?.match ||
                  false,
              },
              {
                field: "Color",
                rtaData:
                  analysis.color?.rta_value ||
                  analysis.color?.rta ||
                  "Not Available",
                aiDetected:
                  analysis.color?.ai_value ||
                  analysis.color?.ai ||
                  "Not Detected",
                match:
                  analysis.color?.match_status === "MATCH" ||
                  analysis.color?.match ||
                  false,
              },
              {
                field: "Vehicle Type",
                rtaData:
                  analysis.vehicle_type?.rta_value ||
                  analysis.vehicle_type?.rta ||
                  "Not Available",
                aiDetected:
                  analysis.vehicle_type?.ai_value ||
                  analysis.vehicle_type?.ai ||
                  "Not Detected",
                match:
                  analysis.vehicle_type?.match_status === "MATCH" ||
                  analysis.vehicle_type?.match ||
                  false,
              },
            ];
          }
        }

        // Fallback: Try to construct from individual fields if available
        if (
          dbAnalysis.vehicle_make ||
          dbAnalysis.vehicle_model ||
          dbAnalysis.vehicle_color
        ) {
          return [
            {
              field: "Make",
              rtaData: dbAnalysis.rta_make || "Not Available",
              aiDetected: dbAnalysis.vehicle_make || "Not Detected",
              match: dbAnalysis.make_match || false,
            },
            {
              field: "Model",
              rtaData: dbAnalysis.rta_model || "Not Available",
              aiDetected: dbAnalysis.vehicle_model || "Not Detected",
              match: dbAnalysis.model_match || false,
            },
            {
              field: "Color",
              rtaData: dbAnalysis.rta_color || "Not Available",
              aiDetected: dbAnalysis.vehicle_color || "Not Detected",
              match: dbAnalysis.color_match || false,
            },
            {
              field: "Vehicle Type",
              rtaData: dbAnalysis.rta_vehicle_type || "Not Available",
              aiDetected: dbAnalysis.vehicle_type || "Not Detected",
              match: dbAnalysis.vehicle_type_match || false,
            },
          ];
        }

        return [];
      } catch (error) {
        return [];
      }
    };

    const step1Data = parseJsonField(dbAnalysis.step1_quality_data);
    const fullResponse = parseJsonField(dbAnalysis.full_analysis_response);

    // Determine status based on database fields and final_result.action
    let status: Challan["status"] = "processing";

    if (dbAnalysis.reviewed === "YES") {
      // Already reviewed by officer
      status =
        dbAnalysis.review_action === "approved" ? "approved" : "rejected";
    } else if (dbAnalysis.status === "completed") {
      // Analysis completed but not yet reviewed
      const finalResultAction = fullResponse.final_result?.action;

      if (finalResultAction === "REJECT_IMAGE" || finalResultAction === "SYSTEM_REJECTED") {
        // Step 1 quality check failed or system rejection flag set - system rejected
        status = "rejected";
      } else if (finalResultAction === "NO_VIOLATIONS_DETECTED") {
        // Valid traffic image but no specific violations found
        status = "violation-not-tagged";
      } else if (finalResultAction === "CHALLAN_READY") {
        // Specific violations found - needs officer review
        status = "pending-review";
      } else {
        // Fallback logic for older records
        const violationTypes = parseJsonField(dbAnalysis.violation_types);
        const hasSpecificViolations =
          Array.isArray(violationTypes) &&
          violationTypes.some((v) =>
            ["No Helmet", "Cell Phone Driving", "Triple Riding"].includes(v)
          );

        status = hasSpecificViolations
          ? "pending-review"
          : "violation-not-tagged";
      }
    }

    return {
      id: dbAnalysis.uuid,
      image: dbAnalysis.s3_url || "", // Use S3 URL as image
      originalFile: null as any, // Not available from database
      preview: dbAnalysis.s3_url || "", // Use S3 URL as preview
      timestamp: new Date(dbAnalysis.created_at).toISOString(),
      plateNumber: dbAnalysis.license_plate_number,
      status,
      sectorOfficer: {
        psName: dbAnalysis.sector_officer_ps_name || "Jubilee Hills Traffic PS",
        cadre: dbAnalysis.sector_officer_cadre || "Police Constable",
        name: dbAnalysis.sector_officer_name || "Unknown",
      },
      capturedBy: {
        psName: "Jubilee Hills Traffic PS",
        cadre: "Police Constable",
        name: "Unknown",
      },
      jurisdiction: {
        psName:
          dbAnalysis.ps_jurisdiction_ps_name || "Jubilee Hills Traffic PS",
        pointName: dbAnalysis.point_name || "Unknown",
      },
      offenceDateTime: {
        date: new Date(dbAnalysis.created_at).toLocaleDateString(),
        time: new Date(dbAnalysis.created_at).toLocaleTimeString(),
      },
      vehicleMatches: populateVehicleMatches(dbAnalysis), // Populated from rta_matches table and step5_comparison_data
      vehicleComparison: dbAnalysis.step5_comparison_data
        ? parseJsonField(dbAnalysis.step5_comparison_data)
        : null,
      violations: parseJsonField(dbAnalysis.violation_types) || [],
      driverGender: dbAnalysis.driver_gender || "Unknown",
      fakePlate: dbAnalysis.fake_plate || false,
      ownerAddress: dbAnalysis.owner_address || "Unknown",
      rtaMatched: dbAnalysis.rta_matched || false,

      // Enhanced fields
      stepAnalysisResponse: fullResponse.success
        ? { ...fullResponse, uuid: dbAnalysis.uuid, rejection_flag: dbAnalysis.rejection_flag }
        : { uuid: dbAnalysis.uuid, rejection_flag: dbAnalysis.rejection_flag },
      qualityAssessment: step1Data,
      vehicleDetails: {
        make: dbAnalysis.vehicle_make || "Unknown",
        model: dbAnalysis.vehicle_model || "Unknown",
        color: dbAnalysis.vehicle_color || "Unknown",
        vehicleType: dbAnalysis.vehicle_type || "Unknown",
        confidence: {
          make: 0.8,
          model: 0.8,
          color: 0.8,
        },
      },
      rtaVerification: {
        status: dbAnalysis.overall_verdict || "Unknown",
        matches: dbAnalysis.rta_matched || false,
        overallScore: dbAnalysis.confidence_score || 0,
        registrationNumber: dbAnalysis.license_plate_number || "Unknown",
      },

      // Review information
      reviewedBy: dbAnalysis.reviewed_by_officer_id,
      reviewTimestamp: dbAnalysis.reviewed_at,
      rejectionReason: dbAnalysis.review_reason,
    };
  };

  // Refresh data from database (can be called manually)
  const refreshData = () => {
    if (isAuthenticated && currentOfficer) {
      fetchAnalysesFromDatabase();
    }
  };

  const addChallan = (file: File): string => {
    const id = `CH${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use current officer info if available, fallback to defaults

    const newChallan: Challan = {
      id,
      originalFile: file,
      preview: URL.createObjectURL(file),
      image: URL.createObjectURL(file),
      status: "processing",
      timestamp: new Date().toISOString(),
      violations: [],
      plateNumber: undefined,
      sectorOfficer: {
        psName: "Jubilee Hills Traffic PS",
        cadre: "Police Constable",
        name: "Unknown",
      },
      capturedBy: {
        psName: "Jubilee Hills Traffic PS",
        cadre: "Police Constable",
        name: "Unknown",
      },
      jurisdiction: {
        psName: "Jubilee Hills Traffic PS",
        pointName: "Unknown",
      },
      offenceDateTime: {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
      vehicleMatches: [],
      driverGender: "Unknown",
      fakePlate: false,
      ownerAddress: "Unknown",
      rtaMatched: false,
    };

    setChallans((prev) => [...prev, newChallan]);
    return id;
  };

  const updateChallanStatus = (id: string, status: Challan["status"]) => {
    setChallans((prev) =>
      prev.map((challan) =>
        challan.id === id ? { ...challan, status } : challan
      )
    );
  };

  const updateChallanWithStepAnalysis = (
    id: string,
    stepAnalysisResponse: StepAnalysisResponse
  ) => {
    setChallans((prev) =>
      prev.map((challan) => {
        if (challan.id === id) {
          // Extract data from the new step analysis structure
          const step1Data = stepAnalysisResponse.results.step1?.data;
          const step2Data = stepAnalysisResponse.results.step2?.data;
          const step3Data = stepAnalysisResponse.results.step3?.data;
          const step4Data = stepAnalysisResponse.results.step4?.data;
          const step5Data = stepAnalysisResponse.results.step5?.data;
          const step6Data = stepAnalysisResponse.results.step6?.data;

          // Extract violations from Step 6 data
          const violationAnalysis = step6Data?.violation_analysis;
          const violations = violationAnalysis?.violation_types_found || [];
          const detectedViolationCount =
            violationAnalysis?.detected_violation_count || 0;

          // Determine status based on violation detection
          // Check multiple sources for violation detection
          const step2ViolationStatus = step2Data?.status;
          const step2ViolationCount =
            step2Data?.violations_detected?.length || 0;
          const step6ViolationCount = detectedViolationCount;
          const finalResultAction = (stepAnalysisResponse as any).final_result
            ?.action;

          let newStatus: Challan["status"];

          // Check if this is marked as no violations detected by the backend
          if (
            finalResultAction === "NO_VIOLATIONS_DETECTED" ||
            ((step2ViolationStatus === "NO_VIOLATION" ||
              step2ViolationCount === 0) &&
              step6ViolationCount === 0 &&
              violations.length === 0)
          ) {
            newStatus = "violation-not-tagged";
          } else {
            // Violations detected - send to pending review
            newStatus = "pending-review";
          }

          // Extract vehicle comparison from Step 5
          const vehicleComparison = step5Data?.comparison_result;

          // Create vehicle matches from Step 5 comparison data
          const vehicleMatches = vehicleComparison
            ? Object.entries(vehicleComparison.parameter_analysis).map(
                ([field, analysis]: [string, any]) => ({
                  field: field.charAt(0).toUpperCase() + field.slice(1),
                  rtaData: analysis.rta_value || "Not Available",
                  aiDetected: analysis.ai_value || "Not Detected",
                  match: analysis.match_status === "MATCH",
                  confidence: vehicleComparison.confidence_score,
                })
              )
            : [];

          // Extract license plate from multiple sources
          const extractedPlate =
            step1Data?.extracted_license_plate ||
            step2Data?.license_plate ||
            step3Data?.license_plate ||
            step6Data?.license_plate;

          // ENHANCED: Extract timestamp from Step 1 analysis if available
          let offenceDateTime = challan.offenceDateTime; // Keep original as fallback

          if (step1Data?.timestamp_extraction?.timestamp_found) {
            const timestampData = step1Data.timestamp_extraction;

            if (timestampData.extracted_date && timestampData.extracted_time) {
              // Use extracted timestamp
              offenceDateTime = {
                date: timestampData.extracted_date,
                time: timestampData.extracted_time,
              };
            } else if (timestampData.extracted_date) {
              // Use extracted date with current time
              offenceDateTime = {
                date: timestampData.extracted_date,
                time: new Date().toLocaleTimeString(),
              };
            } 
          } 

          const updatedChallan = {
            ...challan,
            status: newStatus,
            stepAnalysisResponse,
            qualityAssessment: step1Data,
            ocrData: step2Data,
            plateNumber: extractedPlate || undefined,
            violations,
            violationAnalysis,
            vehicleComparison,
            vehicleAnalysisData: step4Data?.vehicle_analysis,
            qualityCategory: step1Data?.quality_category,
            rtaData: step3Data?.rta_data,
            vehicleMatches,
            rtaMatched: vehicleComparison?.overall_verdict === "MATCH",
            offenceDateTime, // Use extracted or fallback timestamp

            // Legacy compatibility
            vehicleDetails: step4Data?.vehicle_analysis
              ? {
                  make: step4Data.vehicle_analysis.make || "Unknown",
                  model: step4Data.vehicle_analysis.model || "Unknown",
                  color: step4Data.vehicle_analysis.color || "Unknown",
                  vehicleType:
                    step4Data.vehicle_analysis.vehicle_type || "Unknown",
                  confidence: {
                    make: step4Data.vehicle_analysis.analysis_confidence || 0,
                    model: step4Data.vehicle_analysis.analysis_confidence || 0,
                    color: step4Data.vehicle_analysis.analysis_confidence || 0,
                  },
                }
              : undefined,
            rtaVerification: vehicleComparison
              ? {
                  status: vehicleComparison.overall_verdict,
                  matches: vehicleComparison.overall_verdict === "MATCH",
                  overallScore: vehicleComparison.confidence_score,
                  registrationNumber: extractedPlate || "Unknown",
                }
              : undefined,
          };

          return updatedChallan;
        }
        return challan;
      })
    );
  };

  const updateChallanWithWorkflow = (
    id: string,
    workflowResponse: WorkflowResponse
  ) => {
    setChallans((prev) =>
      prev.map((challan) => {
        if (challan.id === id) {
          const summary = workflowResponse.summary;
          if (!summary) {
            return { ...challan, status: "rejected" as Challan["status"] };
          }

          // Extract violations from Step 6 data
          const violations = summary.violation_types || [];
          const detectedViolationCount = summary.violations_found || 0;

          // Determine status based on violation detection (legacy workflow)
          let newStatus: Challan["status"];

          // If no violations are detected, mark as violation-not-tagged
          if (detectedViolationCount === 0 && violations.length === 0) {
            newStatus = "violation-not-tagged";
          } else {
            newStatus = "pending-review";
          }

          // Create vehicle matches from Step 5 comparison data
          const vehicleMatches = summary.comparison_result
            ? Object.entries(summary.comparison_result.parameter_analysis).map(
                ([field, analysis]: [string, any]) => ({
                  field: field.charAt(0).toUpperCase() + field.slice(1),
                  rtaData: analysis.rta_value || "Not Available",
                  aiDetected: analysis.ai_value || "Not Detected",
                  match: analysis.match_status === "MATCH",
                  confidence: summary.comparison_result?.confidence_score,
                })
              )
            : [];

          return {
            ...challan,
            status: newStatus,
            plateNumber: summary.license_plate || undefined,
            violations,
            workflowSummary: summary,
            violationAnalysis: summary.violation_analysis,
            vehicleComparison: summary.comparison_result,
            vehicleAnalysisData: summary.vehicle_analysis,
            qualityCategory: summary.quality_category,
            rtaData: summary.rta_data,
            vehicleMatches,
            rtaMatched: summary.comparison_result?.overall_verdict === "MATCH",

            // Legacy compatibility
            vehicleDetails: summary.vehicle_analysis
              ? {
                  make: summary.vehicle_analysis.make || "Unknown",
                  model: summary.vehicle_analysis.model || "Unknown",
                  color: summary.vehicle_analysis.color || "Unknown",
                  vehicleType:
                    summary.vehicle_analysis.vehicle_type || "Unknown",
                  confidence: {
                    make: summary.vehicle_analysis.analysis_confidence || 0,
                    model: summary.vehicle_analysis.analysis_confidence || 0,
                    color: summary.vehicle_analysis.analysis_confidence || 0,
                  },
                }
              : undefined,
            rtaVerification: summary.comparison_result
              ? {
                  status: summary.comparison_result.overall_verdict,
                  matches:
                    summary.comparison_result.overall_verdict === "MATCH",
                  overallScore: summary.comparison_result.confidence_score,
                  registrationNumber: summary.license_plate || "Unknown",
                }
              : undefined,
          };
        }
        return challan;
      })
    );
  };

  // Legacy method for backward compatibility
  const updateChallanWithAnalysis = (id: string, analysis: any) => {
    setChallans((prev) =>
      prev.map((challan) => {
        if (challan.id === id) {
          const violations =
            analysis.gemini_analysis?.violations?.map((v: any) => v.type) || [];

          return {
            ...challan,
            // ALL successfully analyzed images go to pending-review
            // No auto-approval - everything requires manual review
            status: "pending-review" as Challan["status"],
            geminiAnalysis: analysis,
            plateNumber:
              analysis.gemini_analysis?.vehicle_details?.number_plate?.text,
            violations,
            vehicleDetails: analysis.gemini_analysis?.vehicle_details
              ? {
                  make: analysis.gemini_analysis.vehicle_details.make,
                  model: analysis.gemini_analysis.vehicle_details.model,
                  color: analysis.gemini_analysis.vehicle_details.color,
                  vehicleType:
                    analysis.gemini_analysis.vehicle_details.vehicle_type,
                  confidence: {
                    make: parseFloat(
                      analysis.gemini_analysis.vehicle_details.confidence_scores?.make?.score?.replace(
                        "%",
                        ""
                      ) || "0"
                    ),
                    model: parseFloat(
                      analysis.gemini_analysis.vehicle_details.confidence_scores?.model?.score?.replace(
                        "%",
                        ""
                      ) || "0"
                    ),
                    color: parseFloat(
                      analysis.gemini_analysis.vehicle_details.confidence_scores?.color?.score?.replace(
                        "%",
                        ""
                      ) || "0"
                    ),
                  },
                }
              : undefined,
            rtaVerification: analysis.rta_verification
              ? {
                  status: analysis.rta_verification.status,
                  matches: analysis.rta_verification.matches,
                  overallScore: analysis.rta_verification.overall_score,
                  registrationNumber:
                    analysis.rta_verification.registration_number,
                }
              : undefined,
          };
        }
        return challan;
      })
    );
  };

  const approveChallan = async (id: string, reviewedBy: string) => {
    // Find the challan to get its UUID
    const challan = challans.find((c) => c.id === id);
    if (!challan) {
      return;
    }

    // CRITICAL: Submit review to database first
    if (challan.stepAnalysisResponse?.uuid) {
      try {
        await apiService.submitOfficerReview(
          challan.stepAnalysisResponse.uuid,
          reviewedBy,
          "approved"
        );
      } catch (error) {
        // Continue with local update even if database fails
      }
    }

    // Update local state
    setChallans((prev) =>
      prev.map((challan) =>
        challan.id === id
          ? {
              ...challan,
              status: "approved",
              reviewedBy,
              reviewTimestamp: new Date().toISOString(),
            }
          : challan
      )
    );

    // Refresh data from database to ensure UI is in sync
    try {
      await refreshData();
    } catch (refreshError) {
      return null;
    }
  };

  const rejectChallan = async (
    id: string,
    reason: string,
    reviewedBy: string
  ) => {
    // Find the challan to get its UUID
    const challan = challans.find((c) => c.id === id);
    if (!challan) {
      return;
    }

    // CRITICAL: Submit review to database first
    if (challan.stepAnalysisResponse?.uuid) {
      try {
        await apiService.submitOfficerReview(
          challan.stepAnalysisResponse.uuid,
          reviewedBy,
          "rejected",
          reason
        );
      } catch (error) {
        // Continue with local update even if database fails
      }
    }

    // Update local state
    setChallans((prev) =>
      prev.map((challan) =>
        challan.id === id
          ? {
              ...challan,
              status: "rejected",
              rejectionReason: reason,
              reviewedBy,
              reviewTimestamp: new Date().toISOString(),
            }
          : challan
      )
    );

    // Refresh data from database to ensure UI is in sync
    try {
      await refreshData();
    } catch (refreshError) {
      return null;
    }
  };

  const modifyChallan = (id: string, updates: Partial<Challan>) => {
    setChallans((prev) =>
      prev.map((challan) =>
        challan.id === id ? { ...challan, ...updates } : challan
      )
    );
  };

  const getChallansByStatus = (status: Challan["status"]) => {
    return challans?.filter((challan) => challan?.status === status);
  };

  const value: ChallanContextType = {
    challans,
    isLoading,
    error,
    addChallan,
    updateChallanStatus,
    updateChallanWithStepAnalysis,
    updateChallanWithWorkflow,
    updateChallanWithAnalysis,
    approveChallan,
    rejectChallan,
    modifyChallan,
    getChallansByStatus,
    refreshData: fetchAnalysesFromDatabase,
  };

  return (
    <ChallanContext.Provider value={value}>{children}</ChallanContext.Provider>
  );
};
