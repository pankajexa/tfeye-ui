import React, { useState, useEffect } from "react";
import {
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  PlusIcon,
} from "lucide-react";
import { Challan } from "@/types";
import ImageZoom from "./ImageZoom";
import { apiService } from "../../services/api";
import { Button } from "../ui/button";
import { Loader } from "../index";
import { useToast } from "@/components/toast";
import { ViolationSelect } from "../ui/violation-select";
import { RiResetLeftLine } from "react-icons/ri";
import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { Badge } from "../ui/Badge";
import { Select } from "@/components/ui/select";

interface ChallanCardProps {
  challan: Challan;
  onAction: (number?: any, violationTypes?: any) => void;
  allViolationData?: any;
  setAllViolationData?: any;
}

const violationVariants = [
  // "red",
  // "yellow",
  // "green",
  "blue",
  "orange",
  "indigo",
  "pink",
  "purple",
  "teal",
];

const wheelerTypes = [
  {
    id: "2",
    name: "Motorcycle",
  },
  {
    id: "3",
    name: "Auto rickshaw",
  },
  {
    id: "4",
    name: "Car",
  },
  {
    id: "L",
    name: "L",
  },
  {
    id: "T",
    name: "T",
  },
];
const wheelerCd = {
  scooter: "2",
  motorcycle: "2",
  "auto-rickshaw": "3",
  truck: "T",
  car: "4",
  "2": "2",
  "3": "3",
  "4": "4",
  L: "L",
  T: "T",
  Unknown: "2",
};

const ChallanCard = ({
  challan,
  onAction,
  allViolationData,
  setAllViolationData,
  setViolations,
  violations,
  wheelerType,
  setWheelerType,
  violationsByWheeler,
}) => {
  // Image presigned URL state
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [violationsData, setViolationsData] = useState([]);
  const { error: showErrorToast } = useToast();

  const challanUuid =
    (challan as any)?.uuid ||
    (challan as any)?.stepAnalysisResponse?.uuid ||
    challan?.id;

  // Track the last fetched UUID to avoid unnecessary reloads
  const lastFetchedUuidRef = React.useRef<string | null>(null);

  const updateWheelerAndVio = (wheelCode, vioData) => {
    // Get all possible violations for this wheelCode
    const wheelCodeViolations =
      violationsByWheeler?.[wheelCode] ||
      violationsByWheeler?.[Number(wheelCode)] ||
      [];
    setViolationsData(wheelCodeViolations);
    if (Array.isArray(vioData) && vioData.length > 0) {
      const offenceCodes = vioData.map((item) => String(item?.offence_cd));

      const filteredViolations = wheelCodeViolations?.filter((vio) =>
        offenceCodes.includes(String(vio.offence_cd))
      );

      setViolations(filteredViolations);
    } else {
      setViolations([]);
      return [];
    }
  };

  const getViolationDetails = () => {
    let vehicleType = null;

    if (challan.vehicle_type) {
      vehicleType = challan.vehicle_type;
    }

    // Step 2: If still null, check parameter_analysis.visual_analysis.vehicle_type
    else if (challan.parameter_analysis?.visual_analysis?.vehicle_type) {
      vehicleType = challan.parameter_analysis.visual_analysis.vehicle_type;
    }

    // Step 3: If still null, check vio_data[0].wheeler_cd
    else if (challan.vio_data?.length > 0 && challan.vio_data[0].wheeler_cd) {
      vehicleType = challan.vio_data[0].wheeler_cd;
    }

    // Step 4: Fallback to "2"
    else {
      vehicleType = "2";
    }

    // Normalize to lower-case before mapping
    const normalizedKey = String(vehicleType).toLowerCase();

    const vehilceCd = wheelerCd[normalizedKey] || wheelerCd.Unknown;

    setWheelerType(vehilceCd);
    updateWheelerAndVio(vehilceCd, challan?.vio_data ?? []);
  };

  const getChallanDetails = () => {
    if (!challanUuid) return;

    if ((challan as any)?.modified_vehicle_details?.registrationNumber) {
      setRegistrationNumber(
        (challan as any)?.modified_vehicle_details?.registrationNumber
      );
    } else if (
      (challan as any)?.parameter_analysis?.rta_data_used?.registrationNumber
    ) {
      setRegistrationNumber(
        (challan as any)?.parameter_analysis?.rta_data_used?.registrationNumber
      );
    } else {
      setRegistrationNumber((challan as any)?.license_plate_number);
    }

    // If we already have the image for this UUID, do not re-show loader or refetch
    if (lastFetchedUuidRef.current === challanUuid && imageUrl) {
      return;
    }
  };

  // Simple URL cache - static across all component instances
  const urlCache =
    window.challanUrlCache || (window.challanUrlCache = new Map());

  const fetchImageUrl = async () => {
    if (!challanUuid) return;

    // If we already have the image for this UUID, do not re-show loader or refetch
    if (lastFetchedUuidRef.current === challanUuid && imageUrl) {
      return;
    }

    // CHECK GLOBAL CACHE FIRST
    if (urlCache.has(challanUuid)) {
      setImageUrl(urlCache.get(challanUuid));
      lastFetchedUuidRef.current = challanUuid;
      setImageLoading(false);
      return;
    }
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
          // Cache the URL for future use
          urlCache.set(challanUuid, response.presignedUrl);
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
      if (challan?.image) {
        setImageUrl(challan.image);
        lastFetchedUuidRef.current = challanUuid;
      } else {
        setImageError("Failed to load image");
      }
    } finally {
      setImageLoading(false);
    }
  };

  // Fetch presigned URL for image when challan changes
  useEffect(() => {
    fetchImageUrl();
    getChallanDetails();
    getViolationDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challanUuid]);

  const handleUpdateNumber = () => {
    if (!registrationNumber.trim()) {
      showErrorToast({
        heading: "Invalid Number",
        description:
          "Registration number cannot be empty. Please enter a valid number.",
        placement: "top-right",
      });
      return;
    }

    if (
      ((challan as any)?.modified_vehicle_details?.registrationNumber ??
        (challan as any)?.parameter_analysis?.rta_data_used
          ?.registrationNumber) === registrationNumber
    ) {
      showErrorToast({
        heading: "No Change Detected",
        description:
          "The new registration number must be different from the current one.",
        placement: "top-right",
      });
      return;
    }
    // if (registrationNumber.length !== 10) {
    //   showErrorToast({
    //     heading: "Invalid Length",
    //     description:
    //       "Registration number must be exactly 10 characters long (e.g., TS13ER5007).",
    //     placement: "top-right",
    //   });
    //   return;
    // }

    onAction(registrationNumber, "NUMBER_UPDATE");
  };

  const handleUpdateViolationsData = (values) => {
    try {
      if (!Array.isArray(values)) {
        return [];
      }

      if (!Array.isArray(allViolationData) || allViolationData.length === 0) {
        return [];
      }

      const dataMap = new Map(allViolationData?.map((item) => [item.id, item]));

      const selectedViolations = values
        .filter((id) => {
          if (!dataMap.has(id)) {
            return false;
          }
          return true;
        })
        .map((id) => dataMap.get(id));

      onAction(selectedViolations, "VIOLATIONS_UPDATE");
      setViolations(selectedViolations);
    } catch (error) {
      return [];
    }
  };

  const handleRemoveType = (violation, index) => {
    const updatedData = violations?.filter(
      (item, itemIndx) => itemIndx !== index
    );
    onAction(updatedData, "VIOLATIONS_UPDATE");
    setViolations(updatedData);
  };

  // Helper function to render display field (read-only, editing is done via modal)
  const renderEditableField = (label: string, value: string) => {
    return (
      <div className="flex gap-1">
        <p className="text-sm w-[90px] text-gray-500 text-label">{label}</p>
        <p className="text-xs text-value text-gray-700 font-semibold">
          {value || ""}
        </p>
      </div>
    );
  };

  const handleUpdateWheelerType = (value) => {
    setWheelerType(value);
    updateWheelerAndVio(value, violations);
  };

  const fields = [
    { key: "make_brand", label: "Make", modifiedKey: "make" },
    { key: "model", label: "Model" },
    { key: "color", label: "Color" },
    { key: "vehicle_type", label: "Vehicle Type" },
  ];

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Image Preview with Zoom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="h-96">
              {imageLoading ? (
                <Loader />
              ) : imageError ? (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="text-red-500 mb-2">
                      <svg
                        className="mx-auto h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-red-600 mb-2">{imageError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Refresh to retry
                    </button>
                  </div>
                </div>
              ) : imageUrl ? (
                <div className="relative">
                  <div className="w-full h-96 overflow-hidden rounded-lg border border-gray-200">
                    <div className="relative w-full h-full">
                      <ImageZoom
                        src={imageUrl}
                        alt="Traffic violation"
                        plateNumber={challan.plateNumber}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="mx-auto h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-muted">No image available</p>
                  </div>
                </div>
              )}
              {/* 
              <div className="relative">
                <div className="w-full h-96 overflow-hidden rounded-lg border border-gray-200">
                  <div className="relative w-full h-full">
                    <ImageZoom
                      src={challan?.image}
                      alt="Traffic violation"
                      plateNumber={challan?.plateNumber}
                    />
                  </div>
                </div>
              </div> */}
            </div>
            <div className="grid grid-cols-1 mt-4 gap-4 lg:grid-cols-2">
              <div className="space-y-3 lg:col-span-2 border-b border-gray-200 pb-4">
                <h4 className="text-sm font-semibold text-primary flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  PS Jurisdiction
                </h4>
                <div className="space-y-1 mt-2">
                  {renderEditableField(
                    "PS Name",
                    challan?.ps_jurisdiction_ps_name ||
                      "Jubilee Hills Traffic PS"
                  )}

                  {renderEditableField("Point Name", challan?.point_name || "")}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Sector Officer Details
                </h4>
                <div className="space-y-1 mt-2">
                  {renderEditableField(
                    "PS Name",
                    challan?.sector_officer_ps_name ||
                      "Jubilee Hills Traffic PS"
                  )}
                  {renderEditableField(
                    "Cadre",
                    challan?.sector_officer_cadre || "Police Constable"
                  )}
                  {renderEditableField(
                    "Name",
                    challan?.sector_officer_name || ""
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary flex items-center">
                  <Camera className="h-4 w-4 mr-2" />
                  Image Captured By
                </h4>
                <div className="space-y-1 mt-2">
                  {renderEditableField(
                    "Cadre",
                    challan?.image_captured_by_cadre || "Police Constable"
                  )}
                  {renderEditableField(
                    "Name",
                    challan?.image_captured_by_name || ""
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className=" text-sm">
            <div className="space-y-3">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary">
                  Vehicle Number
                </h4>
                <div className="bg-white  flex items-center justify-between border rounded-lg">
                  <input
                    value={registrationNumber?.toLocaleUpperCase()}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="Enter Valid Vehicle Number"
                    className="px-4 w-full outline-0 text-primary"
                    pattern="[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}"
                    title="Format: TS13ER5909"
                  />
                  <Button
                    onClick={() => {
                      if (
                        (challan as any)?.modified_vehicle_details
                          ?.registrationNumber
                      ) {
                        setRegistrationNumber(
                          (challan as any)?.modified_vehicle_details
                            ?.registrationNumber
                        );
                      } else {
                        setRegistrationNumber(
                          (challan as any)?.license_plate_number
                        );
                      }
                    }}
                    variant={"tertiary"}
                  >
                    <RiResetLeftLine />
                  </Button>
                  <Button
                    onClick={() => handleUpdateNumber()}
                    size={"lg"}
                    variant={"outline"}
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* <div className="flex items-center justify-between">
                {challan && (
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        challan?.overall_verdict === "MATCH"
                          ? "bg-green-100 text-green-800"
                          : challan?.overall_verdict === "PARTIAL_MATCH"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {challan?.overall_verdict === "MATCH"
                        ? "Verified"
                        : challan?.overall_verdict === "PARTIAL_MATCH"
                        ? "Partial Match"
                        : "Mismatch"}
                    </span>
                  </div>
                )}
              </div> */}

              {/* Edit functionality info */}

              <div className="rounded-lg overflow-hidden">
                <table className="min-w-full text-xs">
                  <thead className=" font-medium text-left text-gray-700 uppercase tracking-wider">
                    <tr>
                      <th className="py-3">Detail</th>
                      <th className="py-3">Vehicle & RTA Data</th>
                      <th className="py-3">Detected</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-3 text-gray-600">
                    {fields?.map(({ key, label, modifiedKey }) => {
                      const analysis = (challan as any)?.parameter_analysis
                        ?.comparison_result?.parameter_analysis?.[key];
                      const modified =
                        (challan as any)?.modified_vehicle_details ||
                        (challan as any)?.parameter_analysis?.rta_data_used;

                      let rtaValue: any;
                      let detectedValue: any;

                      if (modified) {
                        // Use modifiedKey if provided, else fallback to key
                        const lookupKey = modifiedKey ?? key;
                        rtaValue = modified[lookupKey] ?? "N/A";
                        detectedValue = analysis?.ai ?? "N/A";
                      } else {
                        rtaValue = analysis?.rta ?? "N/A";
                        detectedValue = analysis?.ai ?? "N/A";
                      }

                      return (
                        <tr key={key}>
                          <td className="py-1.5 font-medium">{label}</td>
                          <td className="py-1.5">{rtaValue}</td>
                          <td className="py-1.5">{detectedValue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {challan?.modified_vehicle_details === null && (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className={`w-full items-center text-sm font-medium `}>
                      {(challan as any)?.overall_verdict === "MATCH" ? (
                        <div className="w-full flex justify-between items-center px-4 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800">
                          Data Verified
                          <CheckCircle className="h-4 w-4 mr-2" />
                        </div>
                      ) : (challan as any)?.overall_verdict ===
                        "PARTIAL_MATCH" ? (
                        <div className="w-full flex justify-between items-center px-4 py-2 rounded-md text-sm font-medium bg-orange-100 text-orange-800">
                          Partial Match
                          <AlertTriangle className="h-4 w-4 mr-2" />
                        </div>
                      ) : (
                        <div className="w-full flex justify-between items-center px-4 py-2 rounded-md text-sm font-medium bg-red-100 text-red-600">
                          Data Mismatch
                          <XCircle className="h-4 w-4 mr-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* System Rejection Reason */}
              {challan?.stepAnalysisResponse?.rejection_flag ===
                "system_rejected" && (
                <div className="flex items-center gap-20 py-4 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-red-600">
                    Rejection Reason
                  </h4>
                  <div className="flex items-center gap-2 font-medium text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      {challan.stepAnalysisResponse?.final_result
                        ?.rejection_reason ||
                        "Image rejected by system due to quality issues"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-20 py-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-primary">
                  Offence Date & Time
                </h4>
                <div className="flex items-center gap-2 font-medium text-sm text-gray-700">
                  <span>
                    {(challan as any)?.created_at
                      ? new Date((challan as any)?.created_at).toLocaleString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "-"}
                  </span>
                </div>
              </div>
              {/* Simplified Violation Analysis - Moved to Bottom */}
              <div className="w-full">
                <div className="space-y-4 pt-3 w-full">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-primary">
                      Violation(s) Detected{" "}
                      {violations?.length ? `(${violations.length})` : ""}
                    </h4>
                    <div className="w-[180px]">
                      <Select
                        // label="Wheeler Type"
                        placeholder="Select point name"
                        value={wheelerType || ""}
                        onValueChange={(value) =>
                          handleUpdateWheelerType(value)
                        }
                        options={wheelerTypes || []}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {violations && violations.length > 0 ? (
                      violations.map((violation, index) => (
                        <div
                          key={`${index}`}
                          className="flex w-full border-b border-gray-200 items-center justify-between py-2"
                        >
                          <Badge
                            variant={violationVariants[index < 7 ? index : 1]}
                            size="md"
                          >
                            {violation?.violation_description}
                          </Badge>
                          <Button
                            onClick={() => handleRemoveType(violation, index)}
                            variant="secondary"
                            size="sm"
                            aria-label={`Remove ${violation?.violation_description}`}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="w-full py-3 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-md text-center">
                        No violations selected. Use the selector below to add.
                      </div>
                    )}
                  </div>

                  <div className="w-full">
                    <Menu as="div" className="relative w-full">
                      {({ open, close }) => (
                        <>
                          <MenuButton className="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-500 shadow-xs inset-ring-1 inset-ring-purple-300 cursor-pointer hover:bg-purple-100">
                            <PlusIcon aria-hidden="true" className="mr-1 w-5" />
                            ADD VIOLATION
                          </MenuButton>

                          <MenuItems
                            static={open}
                            className="absolute right-0 z-10 mt-0 w-full origin-top-right rounded-md bg-white shadow-lg outline-1 outline-black/5"
                          >
                            <ViolationSelect
                              options={violationsData || []}
                              value={
                                Array.isArray(violations)
                                  ? violations.map((item) => Number(item?.id))
                                  : []
                              }
                              onValueChange={(values) => {
                                if (Array.isArray(values)) {
                                  const unique = Array.from(
                                    new Set(values as string[])
                                  );
                                  handleUpdateViolationsData(unique);
                                  // Close menu after selection
                                  close();
                                }
                              }}
                              multiple={true}
                              clearable={true}
                              placeholder="Search and select violations..."
                              hideTrigger={true}
                              autoFocusSearch={true}
                              closeOnSelectEach={false}
                              isOpen={open}
                              className="border-0 shadow-none"
                            />
                          </MenuItems>
                        </>
                      )}
                    </Menu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanCard;
