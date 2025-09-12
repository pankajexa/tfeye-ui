import React from "react";
import { useChallanContext } from "../context/ChallanContext";
import ChallanCard from "./ImageDetails/ChallanCard";
import { AlertTriangle, Camera, Search, FileX } from "lucide-react";
import ImageDetails from "./ImageDetails/ImageDetails";

const ViolationNotTaggedTab: React.FC = () => {
  const {
    challans,
    getChallansByStatus,
    updateChallanWithStepAnalysis,
    modifyChallan,
  } = useChallanContext();
  const violationNotTaggedChallans = getChallansByStatus(
    "violation-not-tagged"
  );

  const handleAction = (
    action: string,
    reason?: string,
    updatedChallan?: any
  ) => {
    try {
      if (action === "approve" && updatedChallan) {
        // Move to approved with manual review flag
        modifyChallan(updatedChallan.id, {
          status: "approved",
          reviewedBy: "Manual Review - No AI Violations",
          reviewTimestamp: new Date().toLocaleString(),
        });
      } else if (action === "reject" && updatedChallan && reason) {
        modifyChallan(updatedChallan.id, {
          status: "rejected",
          rejectionReason: reason,
          reviewedBy: "Manual Review",
          reviewTimestamp: new Date().toLocaleString(),
        });
      } else if (action === "modify" && updatedChallan) {
        // Check if this is a full StepAnalysisResponse (from re-analysis)
        // or just a partial challan update
        const isStepAnalysisResponse =
          updatedChallan.results &&
          updatedChallan.workflow &&
          updatedChallan.success !== undefined;

        if (isStepAnalysisResponse) {
          // This is a full step analysis response (from license plate re-analysis)
          updateChallanWithStepAnalysis(updatedChallan.id, updatedChallan);
        } else {
          // Check if license plate was modified (requires special handling)
          const currentChallan = violationNotTaggedChallans[currentIndex];
          const isLicensePlateModified =
            updatedChallan.plateNumber !== currentChallan?.plateNumber &&
            updatedChallan.plateNumber;

          if (isLicensePlateModified) {
            // For license plate modifications, we need to trigger re-analysis
            // This should be handled by the ChallanCard's saveEdit function
            // But we still need to update the challan status
            modifyChallan(updatedChallan.id, {
              plateNumber: updatedChallan.plateNumber,
              reviewedBy: "License Plate Modified",
              reviewTimestamp: new Date().toLocaleString(),
            });
          } else {
            // For other modifications (vehicle details, etc.)
            modifyChallan(updatedChallan.id, {
              reviewedBy: "Manual Modification",
              reviewTimestamp: new Date().toLocaleString(),
            });
          }
        }
      } else if (action === "tag-violation" && updatedChallan) {
        modifyChallan(updatedChallan.id, {
          status: "pending-review",
          reviewedBy: "Manual Violation Tagging",
          reviewTimestamp: new Date().toLocaleString(),
        });
      }
    } catch (error) {
      // Show user-friendly error message
      alert(
        `An error occurred while processing the action: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const currentIndex = 0; // For single challan view
  const currentChallan = violationNotTaggedChallans[currentIndex];

  // Error boundary for the component
  if (!currentChallan) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-orange-100 p-4 rounded-full">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              No Challans Available
            </h3>
            <p className="text-gray-500 mt-1">
              There are currently no challans in the Violation Not Tagged
              section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Challans Display */}
      {violationNotTaggedChallans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-green-100 p-4 rounded-full">
              <Search className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">All Clear!</h3>
              <p className="text-gray-500 mt-1">
                No images with untagged violations at the moment.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                All analyzed images either have violations detected or have been
                processed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ImageDetails pendingChallans={violationNotTaggedChallans} />

          {/* {violationNotTaggedChallans?.map((challan, index) => (
            <div
              key={challan?.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >              <div className="bg-orange-50 px-6 py-3 border-b border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      #{index + 1} of {violationNotTaggedChallans?.length}
                    </span>
                    <span className="text-sm text-gray-600">
                      Captured: {new Date(challan?.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      No Violations Detected
                    </span>
                    {challan.qualityCategory && (
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          challan.qualityCategory === "GOOD"
                            ? "bg-green-100 text-green-800"
                            : challan.qualityCategory === "FAIR"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        Quality: {challan.qualityCategory}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {(() => {
                  try {
                    return (
                      <ChallanCard
                        key={`${challan.id}-${challan.timestamp}`}
                        challan={challan}
                        onAction={handleAction}
                      />
                    );
                  } catch (error) {
                    return (
                      <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="bg-red-100 p-4 rounded-full">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              Error Loading Challan
                            </h3>
                            <p className="text-gray-500 mt-1">
                              An error occurred while loading this challan.
                              Please refresh the page.
                            </p>
                            <button
                              onClick={() => window.location.reload()}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Refresh Page
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              {challan.stepAnalysisResponse && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    AI Analysis Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Steps Completed:</span>
                      <span className="ml-2 font-medium">
                        {
                          Object.keys(challan.stepAnalysisResponse.results)
                            .length
                        }{" "}
                        / 6
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Final Status:</span>
                      <span className="ml-2 font-medium text-orange-600">
                        No Violations Found
                      </span>
                    </div>
                    {challan.stepAnalysisResponse.results.step2?.data && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Detection Result:</span>
                        <span className="ml-2 font-medium">
                          {challan.stepAnalysisResponse.results.step2.data
                            .status === "NO_VIOLATION"
                            ? "No violations detected by AI analysis"
                            : "Analysis completed without violations"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))} */}
        </div>
      )}
    </div>
  );
};

export default ViolationNotTaggedTab;
