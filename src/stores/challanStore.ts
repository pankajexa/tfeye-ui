import { create } from "zustand";
import { WorkflowResponse, apiService } from "../services/api";
import { RTAData, StepAnalysisResponse, QualityAssessmentData, OCRData, VehicleAnalysis, VehicleComparison, ViolationAnalysis, WorkflowSummary } from "../types";

export interface Challan {
  id: string;
  originalFile: File | null;
  preview: string;
  image: string;
  status: "processing" | "pending-review" | "approved" | "rejected" | "violation-not-tagged";
  timestamp: string;
  plateNumber?: string;
  violations: string[];
  sectorOfficer: { psName: string; cadre: string; name: string };
  capturedBy: { psName: string; cadre: string; name: string };
  jurisdiction: { psName: string; pointName: string };
  offenceDateTime: { date: string; time: string };
  vehicleMatches: Array<{ field: string; rtaData: string; aiDetected: string; match: boolean; confidence?: number }>;
  driverGender: string;
  fakePlate: boolean;
  ownerAddress: string;
  rtaMatched: boolean;
  rtaData?: RTAData;
  rtaApiStatus?: "pending" | "success" | "failed";
  rtaApiError?: string;
  stepAnalysisResponse?: StepAnalysisResponse;
  qualityAssessment?: QualityAssessmentData;
  ocrData?: OCRData;
  workflowSummary?: WorkflowSummary;
  violationAnalysis?: ViolationAnalysis;
  vehicleComparison?: VehicleComparison | null;
  vehicleAnalysisData?: VehicleAnalysis;
  qualityCategory?: string;
  vehicleDetails?: {
    make: string;
    model: string;
    color: string;
    vehicleType: string;
    confidence: { make: number; model: number; color: number };
  };
  rtaVerification?: {
    status: string;
    matches: boolean;
    overallScore: number;
    registrationNumber: string;
  };
  geminiAnalysis?: any;
  reviewedBy?: string;
  reviewTimestamp?: string;
  rejectionReason?: string;
}

type ChallanState = {
  challans: Challan[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addChallan: (file: File) => string;
  updateChallanStatus: (id: string, status: Challan["status"]) => void;
  updateChallanWithStepAnalysis: (id: string, stepAnalysisResponse: StepAnalysisResponse) => void;
  updateChallanWithWorkflow: (id: string, workflowResponse: WorkflowResponse) => void;
  updateChallanWithAnalysis: (id: string, analysis: any) => void;
  approveChallan: (id: string, reviewedBy: string) => Promise<void>;
  rejectChallan: (id: string, reason: string, reviewedBy: string) => Promise<void>;
  modifyChallan: (id: string, updates: Partial<Challan>) => void;
  getChallansByStatus: (status: Challan["status"]) => Challan[];
};

export const useChallanStore = create<ChallanState>((set, get) => ({
  challans: [],
  isLoading: true,
  error: null,
  refreshData: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.getRecentAnalyses(100, 0);
      if (response.success) {
        const dbAnalyses = response.data;
        const converted = dbAnalyses.map(convertDbAnalysisToChallan);
        set({ challans: converted });
      } else {
        throw new Error("Failed to fetch analyses from database");
      }
    } catch (e) {
      set({ error: "Failed to load analyses from database", challans: [] });
    } finally {
      set({ isLoading: false });
    }
  },
  addChallan: (file: File) => {
    const id = `CH${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = URL.createObjectURL(file);
    const newChallan: Challan = {
      id,
      originalFile: file,
      preview: url,
      image: url,
      status: "processing",
      timestamp: new Date().toISOString(),
      violations: [],
      plateNumber: undefined,
      sectorOfficer: { psName: "Jubilee Hills Traffic PS", cadre: "Police Constable", name: "Unknown" },
      capturedBy: { psName: "Jubilee Hills Traffic PS", cadre: "Police Constable", name: "Unknown" },
      jurisdiction: { psName: "Jubilee Hills Traffic PS", pointName: "Unknown" },
      offenceDateTime: { date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() },
      vehicleMatches: [],
      driverGender: "Unknown",
      fakePlate: false,
      ownerAddress: "Unknown",
      rtaMatched: false,
    };
    set((s) => ({ challans: [...s.challans, newChallan] }));
    return id;
  },
  updateChallanStatus: (id, status) => {
    set((s) => ({ challans: s.challans.map((c) => (c.id === id ? { ...c, status } : c)) }));
  },
  updateChallanWithStepAnalysis: (id, stepAnalysisResponse) => {
    set((s) => ({
      challans: s.challans.map((challan) => {
        if (challan.id !== id) return challan;
        const step1Data = stepAnalysisResponse.results.step1?.data;
        const step2Data = stepAnalysisResponse.results.step2?.data;
        const step3Data = stepAnalysisResponse.results.step3?.data;
        const step4Data = stepAnalysisResponse.results.step4?.data;
        const step5Data = stepAnalysisResponse.results.step5?.data;
        const step6Data = stepAnalysisResponse.results.step6?.data;

        const violationAnalysis = step6Data?.violation_analysis;
        const violations = violationAnalysis?.violation_types_found || [];
        const detectedViolationCount = violationAnalysis?.detected_violation_count || 0;

        const step2ViolationStatus = step2Data?.status;
        const step2ViolationCount = step2Data?.violations_detected?.length || 0;
        const step6ViolationCount = detectedViolationCount;
        const finalResultAction = (stepAnalysisResponse as any).final_result?.action;

        const newStatus: Challan["status"] =
          finalResultAction === "NO_VIOLATIONS_DETECTED" || ((step2ViolationStatus === "NO_VIOLATION" || step2ViolationCount === 0) && step6ViolationCount === 0 && violations.length === 0)
            ? "violation-not-tagged"
            : "pending-review";

        const vehicleComparison = step5Data?.comparison_result;
        const vehicleMatches = vehicleComparison
          ? Object.entries(vehicleComparison.parameter_analysis).map(([field, analysis]: [string, any]) => ({
              field: field.charAt(0).toUpperCase() + field.slice(1),
              rtaData: (analysis as any).rta_value || "Not Available",
              aiDetected: (analysis as any).ai_value || "Not Detected",
              match: (analysis as any).match_status === "MATCH",
              confidence: vehicleComparison.confidence_score,
            }))
          : [];

        const extractedPlate =
          step1Data?.extracted_license_plate ||
          step2Data?.license_plate ||
          step3Data?.license_plate ||
          step6Data?.license_plate;

        let offenceDateTime = challan.offenceDateTime;
        if (step1Data?.timestamp_extraction?.timestamp_found) {
          const t = step1Data.timestamp_extraction;
          if (t.extracted_date && t.extracted_time) {
            offenceDateTime = { date: t.extracted_date, time: t.extracted_time };
          } else if (t.extracted_date) {
            offenceDateTime = { date: t.extracted_date, time: new Date().toLocaleTimeString() };
          }
        }

        return {
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
          offenceDateTime,
          vehicleDetails: step4Data?.vehicle_analysis
            ? {
                make: step4Data.vehicle_analysis.make || "Unknown",
                model: step4Data.vehicle_analysis.model || "Unknown",
                color: step4Data.vehicle_analysis.color || "Unknown",
                vehicleType: step4Data.vehicle_analysis.vehicle_type || "Unknown",
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
      }),
    }));
  },
  updateChallanWithWorkflow: (id, workflowResponse) => {
    set((s) => ({
      challans: s.challans.map((challan) => {
        if (challan.id !== id) return challan;
        const summary = workflowResponse.summary;
        if (!summary) return { ...challan, status: "rejected" };
        const violations = summary.violation_types || [];
        const detectedViolationCount = summary.violations_found || 0;
        const newStatus: Challan["status"] =
          detectedViolationCount === 0 && violations.length === 0 ? "violation-not-tagged" : "pending-review";
        const vehicleMatches = summary.comparison_result
          ? Object.entries(summary.comparison_result.parameter_analysis).map(([field, analysis]: [string, any]) => ({
              field: field.charAt(0).toUpperCase() + field.slice(1),
              rtaData: (analysis as any).rta_value || "Not Available",
              aiDetected: (analysis as any).ai_value || "Not Detected",
              match: (analysis as any).match_status === "MATCH",
              confidence: summary.comparison_result?.confidence_score,
            }))
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
          vehicleDetails: summary.vehicle_analysis
            ? {
                make: summary.vehicle_analysis.make || "Unknown",
                model: summary.vehicle_analysis.model || "Unknown",
                color: summary.vehicle_analysis.color || "Unknown",
                vehicleType: summary.vehicle_analysis.vehicle_type || "Unknown",
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
                matches: summary.comparison_result.overall_verdict === "MATCH",
                overallScore: summary.comparison_result.confidence_score,
                registrationNumber: summary.license_plate || "Unknown",
              }
            : undefined,
        };
      }),
    }));
  },
  updateChallanWithAnalysis: (id, analysis) => {
    set((s) => ({
      challans: s.challans.map((challan) => {
        if (challan.id !== id) return challan;
        const violations = analysis.gemini_analysis?.violations?.map((v: any) => v.type) || [];
        return {
          ...challan,
          status: "pending-review",
          geminiAnalysis: analysis,
          plateNumber: analysis.gemini_analysis?.vehicle_details?.number_plate?.text,
          violations,
          vehicleDetails: analysis.gemini_analysis?.vehicle_details
            ? {
                make: analysis.gemini_analysis.vehicle_details.make,
                model: analysis.gemini_analysis.vehicle_details.model,
                color: analysis.gemini_analysis.vehicle_details.color,
                vehicleType: analysis.gemini_analysis.vehicle_details.vehicle_type,
                confidence: {
                  make: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores?.make?.score?.replace("%", "") || "0"),
                  model: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores?.model?.score?.replace("%", "") || "0"),
                  color: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores?.color?.score?.replace("%", "") || "0"),
                },
              }
            : undefined,
          rtaVerification: analysis.rta_verification
            ? {
                status: analysis.rta_verification.status,
                matches: analysis.rta_verification.matches,
                overallScore: analysis.rta_verification.overall_score,
                registrationNumber: analysis.rta_verification.registration_number,
              }
            : undefined,
        };
      }),
    }));
  },
  approveChallan: async (id, reviewedBy) => {
    const challan = get().challans.find((c) => c.id === id);
    if (challan?.stepAnalysisResponse?.uuid) {
      try {
        await apiService.submitOfficerReview(challan.stepAnalysisResponse.uuid, reviewedBy, "approved");
      } catch {}
    }
    set((s) => ({
      challans: s.challans.map((c) =>
        c.id === id ? { ...c, status: "approved", reviewedBy, reviewTimestamp: new Date().toISOString() } : c
      ),
    }));
    try { await get().refreshData(); } catch {}
  },
  rejectChallan: async (id, reason, reviewedBy) => {
    const challan = get().challans.find((c) => c.id === id);
    if (challan?.stepAnalysisResponse?.uuid) {
      try {
        await apiService.submitOfficerReview(challan.stepAnalysisResponse.uuid, reviewedBy, "rejected", reason);
      } catch {}
    }
    set((s) => ({
      challans: s.challans.map((c) =>
        c.id === id ? { ...c, status: "rejected", rejectionReason: reason, reviewedBy, reviewTimestamp: new Date().toISOString() } : c
      ),
    }));
    try { await get().refreshData(); } catch {}
  },
  modifyChallan: (id, updates) => {
    set((s) => ({ challans: s.challans.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
  },
  getChallansByStatus: (status) => {
    return get().challans.filter((c) => c.status === status);
  },
}));

function parseJsonField(field: any): any {
  if (typeof field === "string") {
    try { return JSON.parse(field); } catch { return {}; }
  }
  return field || {};
}

function convertDbAnalysisToChallan(dbAnalysis: any): Challan {
  const step1Data = parseJsonField(dbAnalysis.step1_quality_data);
  const fullResponse = parseJsonField(dbAnalysis.full_analysis_response);

  const status: Challan["status"] = (() => {
    if (dbAnalysis.reviewed === "YES") {
      return dbAnalysis.review_action === "approved" ? "approved" : "rejected";
    } else if (dbAnalysis.status === "completed") {
      const action = fullResponse.final_result?.action;
      if (action === "REJECT_IMAGE") return "rejected";
      if (action === "NO_VIOLATIONS_DETECTED") return "violation-not-tagged";
      if (action === "CHALLAN_READY") return "pending-review";
      const violationTypes = parseJsonField(dbAnalysis.violation_types);
      const hasSpecificViolations = Array.isArray(violationTypes) && violationTypes.some((v: string) => ["No Helmet", "Cell Phone Driving", "Triple Riding"].includes(v));
      return hasSpecificViolations ? "pending-review" : "violation-not-tagged";
    }
    return "processing";
  })();

  const vehicleMatches = (() => {
    try {
      if (dbAnalysis.step5_comparison_data) {
        const step5Data = parseJsonField(dbAnalysis.step5_comparison_data);
        if (step5Data?.parameter_analysis) {
          const analysis = step5Data.parameter_analysis;
          return [
            { field: "Make", rtaData: analysis.make_brand?.rta || analysis.make?.rta_value || analysis.make?.rta || "Not Available", aiDetected: analysis.make_brand?.ai || analysis.make?.ai_value || analysis.make?.ai || "Not Detected", match: analysis.make_brand?.match || analysis.make?.match_status === "MATCH" || analysis.make?.match || false },
            { field: "Model", rtaData: analysis.model?.rta_value || analysis.model?.rta || "Not Available", aiDetected: analysis.model?.ai_value || analysis.model?.ai || "Not Detected", match: analysis.model?.match_status === "MATCH" || analysis.model?.match || false },
            { field: "Color", rtaData: analysis.color?.rta_value || analysis.color?.rta || "Not Available", aiDetected: analysis.color?.ai_value || analysis.color?.ai || "Not Detected", match: analysis.color?.match_status === "MATCH" || analysis.color?.match || false },
            { field: "Vehicle Type", rtaData: analysis.vehicle_type?.rta_value || analysis.vehicle_type?.rta || "Not Available", aiDetected: analysis.vehicle_type?.ai_value || analysis.vehicle_type?.ai || "Not Detected", match: analysis.vehicle_type?.match_status === "MATCH" || analysis.vehicle_type?.match || false },
          ];
        }
      }
      if (dbAnalysis.vehicle_make || dbAnalysis.vehicle_model || dbAnalysis.vehicle_color) {
        return [
          { field: "Make", rtaData: dbAnalysis.rta_make || "Not Available", aiDetected: dbAnalysis.vehicle_make || "Not Detected", match: dbAnalysis.make_match || false },
          { field: "Model", rtaData: dbAnalysis.rta_model || "Not Available", aiDetected: dbAnalysis.vehicle_model || "Not Detected", match: dbAnalysis.model_match || false },
          { field: "Color", rtaData: dbAnalysis.rta_color || "Not Available", aiDetected: dbAnalysis.vehicle_color || "Not Detected", match: dbAnalysis.color_match || false },
          { field: "Vehicle Type", rtaData: dbAnalysis.rta_vehicle_type || "Not Available", aiDetected: dbAnalysis.vehicle_type || "Not Detected", match: dbAnalysis.vehicle_type_match || false },
        ];
      }
      return [];
    } catch {
      return [];
    }
  })();

  return {
    id: dbAnalysis.uuid,
    image: dbAnalysis.s3_url || "",
    originalFile: null,
    preview: dbAnalysis.s3_url || "",
    timestamp: new Date(dbAnalysis.created_at).toISOString(),
    plateNumber: dbAnalysis.license_plate_number,
    status,
    sectorOfficer: {
      psName: dbAnalysis.sector_officer_ps_name || "Jubilee Hills Traffic PS",
      cadre: dbAnalysis.sector_officer_cadre || "Police Constable",
      name: dbAnalysis.sector_officer_name || "Unknown",
    },
    capturedBy: { psName: "Jubilee Hills Traffic PS", cadre: "Police Constable", name: "Unknown" },
    jurisdiction: { psName: dbAnalysis.ps_jurisdiction_ps_name || "Jubilee Hills Traffic PS", pointName: dbAnalysis.point_name || "Unknown" },
    offenceDateTime: {
      date: dbAnalysis.offence_date ? new Date(dbAnalysis.offence_date).toLocaleDateString() : new Date(dbAnalysis.created_at).toLocaleDateString(),
      time: dbAnalysis.offence_time ? dbAnalysis.offence_time : new Date(dbAnalysis.created_at).toLocaleTimeString()
    },
    vehicleMatches,
    vehicleComparison: dbAnalysis.step5_comparison_data ? parseJsonField(dbAnalysis.step5_comparison_data) : null,
    violations: parseJsonField(dbAnalysis.violation_types) || [],
    driverGender: dbAnalysis.driver_gender || "Unknown",
    fakePlate: dbAnalysis.fake_plate || false,
    ownerAddress: dbAnalysis.owner_address || "Unknown",
    rtaMatched: dbAnalysis.rta_matched || false,
    stepAnalysisResponse: fullResponse.success ? { ...fullResponse, uuid: dbAnalysis.uuid } : { uuid: dbAnalysis.uuid },
    qualityAssessment: step1Data,
    vehicleDetails: {
      make: dbAnalysis.vehicle_make || "Unknown",
      model: dbAnalysis.vehicle_model || "Unknown",
      color: dbAnalysis.vehicle_color || "Unknown",
      vehicleType: dbAnalysis.vehicle_type || "Unknown",
      confidence: { make: 0.8, model: 0.8, color: 0.8 },
    },
    rtaVerification: {
      status: dbAnalysis.overall_verdict || "Unknown",
      matches: dbAnalysis.rta_matched || false,
      overallScore: dbAnalysis.confidence_score || 0,
      registrationNumber: dbAnalysis.license_plate_number || "Unknown",
    },
    reviewedBy: dbAnalysis.reviewed_by_officer_id,
    reviewTimestamp: dbAnalysis.reviewed_at,
    rejectionReason: dbAnalysis.review_reason,
  };
}


