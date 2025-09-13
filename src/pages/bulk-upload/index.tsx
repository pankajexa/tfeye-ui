import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/toast/useToast";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  FileImage,
  RotateCcw,
  User,
} from "lucide-react";
import { BACKEND_URL } from "@/constants/globalConstants";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
  backendResponse?: any;
}


const MAX_IMAGES = 20;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const BulkImageUpload: React.FC = () => {
  const { currentOfficer } = useAuth();
  const { success, error, info } = useToast();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Officer form state
  const [selectedPointName, setSelectedPointName] = useState<string>("");
  const [selectedOfficerName, setSelectedOfficerName] = useState<string>("");
  const [isFormCompleted, setIsFormCompleted] = useState<boolean>(false);

  const [officersDetails, setOfficerDetails] = useState([]);
  const [poinsDetails, setPoinsDetails] = useState([]);

  async function getPointNames() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ui/point-names`);

      if (!res.ok) {
        throw new Error(`Failed to fetch point names: ${res.status}`);
      }

      const data = await res.json();
      setPoinsDetails(
        (data?.data || []).map((officer: any) => ({
          ...officer,
          name: officer?.point_name, // rename
          id: officer?.point_name, // rename
        }))
      );
      return data || [];
    } catch (error) {
      return [];
    }
  }
  async function getOfficerNames() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ui/officer-names`);

      if (!res.ok) {
        throw new Error(`Failed to fetch officer names: ${res.status}`);
      }

      const data = await res.json();
      setOfficerDetails(
        (data?.data || []).map((officer: any) => ({
          ...officer,
          name: officer?.officer_name, // rename
          id: officer?.officer_name, // rename
        }))
      );
    } catch (error) {
      return [];
    }
  }

  useEffect(() => {
    getPointNames();
    getOfficerNames();
  }, []);

  // Check if form is completed
  useEffect(() => {
    setIsFormCompleted(selectedPointName !== "" && selectedOfficerName !== "");
  }, [selectedPointName, selectedOfficerName]);

  // Validate file type
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only image files (JPG, JPEG, PNG, WebP) are allowed";
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      return "File size must be less than 10MB";
    }
    return null;
  };

  // Generate preview URL
  const createPreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  // Upload single image to backend
  const uploadImage = async (
    imageId: string,
    file: File
  ): Promise<UploadedImage> => {
    const preview = createPreview(file);

    const uploadedImage: UploadedImage = {
      id: imageId,
      file,
      preview,
      status: "uploading",
      progress: 0,
    };

    try {
      // Validate required fields
      if (!selectedPointName || !selectedOfficerName) {
        throw new Error("Point name and officer name are required");
      }

      // Update progress to show upload starting
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, progress: 10 } : img
        )
      );

      // Upload to backend with progress tracking
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("image", file);
      formData.append("point_name", selectedPointName);
      formData.append("officer_name", selectedOfficerName);

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadedImages((prev) =>
              prev.map((img) =>
                img.id === imageId ? { ...img, progress } : img
              )
            );
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              const successImage = {
                ...uploadedImage,
                status: "success" as const,
                progress: 100,
                backendResponse: response,
              };

              setUploadedImages((prev) =>
                prev.map((img) => (img.id === imageId ? successImage : img))
              );
              resolve(successImage);
            } catch (parseError) {
              const errorMsg = "Failed to parse backend response";
              setUploadedImages((prev) =>
                prev.map((img) =>
                  img.id === imageId
                    ? { ...img, status: "error" as const, error: errorMsg }
                    : img
                )
              );
              reject(new Error(errorMsg));
            }
          } else {
            const errorMsg = `Upload failed with status ${xhr.status}`;
            setUploadedImages((prev) =>
              prev.map((img) =>
                img.id === imageId
                  ? { ...img, status: "error" as const, error: errorMsg }
                  : img
              )
            );
            reject(new Error(errorMsg));
          }
        });

        xhr.addEventListener("error", () => {
          const errorMsg = "Upload failed";
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === imageId
                ? { ...img, status: "error" as const, error: errorMsg }
                : img
            )
          );
          reject(new Error(errorMsg));
        });

        xhr.open("POST", `${BACKEND_URL}/api/ui/upload-image`);
        xhr.send(formData);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Upload failed";
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                status: "error" as const,
                error: errorMsg,
              }
            : img
        )
      );
      throw error;
    }
  };

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      // Check if form is completed before allowing uploads
      if (!isFormCompleted) {
        error(
          "Please select point name and officer name before uploading images."
        );
        return;
      }

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate files
      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else if (uploadedImages.length + validFiles.length < MAX_IMAGES) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: Maximum ${MAX_IMAGES} images allowed`);
        }
      });

      // Show validation errors
      if (errors.length > 0) {
        error({
          heading: "File Validation Errors",
          description: errors.join("\n"),
        });
      }

      if (validFiles.length === 0) return;

      // Prevent multiple simultaneous uploads
      if (isUploading) {
        info("Upload already in progress. Please wait...");
        return;
      }

      setIsUploading(true);

      // Show info about starting upload
      info(`Starting upload of ${validFiles.length} image(s) to backend...`);

      // Add valid files to state
      const newImages: UploadedImage[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: createPreview(file),
        status: "uploading",
        progress: 0,
      }));

      setUploadedImages((prev) => [...prev, ...newImages]);

      // Upload files sequentially to avoid overwhelming the server
      let successCount = 0;
      let errorCount = 0;

      for (const image of newImages) {
        try {
          await uploadImage(image.id, image.file);
          successCount++;
        } catch (uploadError) {
          errorCount++;
          console.error("Upload failed for", image.file.name, uploadError);
        }
      }

      setIsUploading(false);

      // Show final results
      if (successCount > 0 && errorCount === 0) {
        success(`Successfully uploaded ${successCount} image(s) to backend!`);
      } else if (successCount > 0 && errorCount > 0) {
        error({
          heading: "Partial Upload Success",
          description: `${successCount} uploaded successfully, ${errorCount} failed. Check individual images for details.`,
        });
      } else if (errorCount > 0) {
        error(`Failed to upload ${errorCount} image(s). Please try again.`);
      }
    },
    [
      uploadedImages.length,
      currentOfficer?.id,
      isUploading,
      isFormCompleted,
      error,
    ]
  );

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // Remove image
  const removeImage = (id: string) => {
    setUploadedImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  // Retry failed upload
  const retryUpload = async (id: string) => {
    const image = uploadedImages.find((img) => img.id === id);
    if (!image || image.status === "uploading") return;

    try {
      // Reset status to uploading
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? {
                ...img,
                status: "uploading" as const,
                progress: 0,
                error: undefined,
              }
            : img
        )
      );

      await uploadImage(id, image.file);
      success(`Successfully retried upload for ${image.file.name}`);
    } catch (error) {
      console.error("Retry failed for", image.file.name, error);
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  const successfulUploads = uploadedImages?.filter(
    (img) => img?.status === "success"
  ).length;
  const failedUploads = uploadedImages?.filter(
    (img) => img?.status === "error"
  ).length;
  const uploadingCount = uploadedImages?.filter(
    (img) => img?.status === "uploading"
  ).length;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Image Upload</h1>
        <p className="text-gray-600 text-base">
          Upload traffic violation images for analysis. Maximum {MAX_IMAGES}{" "}
          images allowed.
        </p>
        {currentOfficer && (
          <p className="text-sm text-gray-500 mt-1">
            Officer: {currentOfficer?.name} ({currentOfficer?.id}) -{" "}
            {currentOfficer?.psName}
          </p>
        )}
      </div>

      {/* Officer Selection Form */}
      <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Officer Details
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Please select your point name and officer name before uploading
          images.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Point Name Selection */}
          <div className="space-y-2">
            <Select
              label="Point Name"
              placeholder="Select point name"
              value={selectedPointName}
              onValueChange={(value) => setSelectedPointName(value as string)}
              options={poinsDetails || []}
              searchable={true}
              required
            />
          </div>

          {/* Officer Name Selection */}
          <div className="space-y-2">
            <Select
              label="Officer Name"
              placeholder="Select officer name"
              value={selectedOfficerName}
              onValueChange={(value) => setSelectedOfficerName(value as string)}
              options={officersDetails || []}
              searchable={true}
              required
            />
          </div>
        </div>

        {/* Form Status */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isFormCompleted ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Form completed</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Please complete the form
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Area - Only show when form is completed */}
      {isFormCompleted ? (
        <>
          {/* Upload Counter */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Uploaded: {successfulUploads}/{MAX_IMAGES}
                  </span>
                </div>
                {failedUploads > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      Failed: {failedUploads}
                    </span>
                  </div>
                )}
                {uploadingCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-blue-700">
                      Uploading: {uploadingCount}
                    </span>
                  </div>
                )}
              </div>
              {uploadedImages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    uploadedImages.forEach((img) =>
                      URL.revokeObjectURL(img.preview)
                    );
                    setUploadedImages([]);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadedImages.length >= MAX_IMAGES || isUploading}
            />

            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {uploadedImages.length >= MAX_IMAGES
                    ? "Maximum images reached"
                    : isUploading
                    ? "Uploading images..."
                    : "Upload Images"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {uploadedImages.length >= MAX_IMAGES
                    ? `You have reached the maximum of ${MAX_IMAGES} images. Remove some images to upload more.`
                    : isUploading
                    ? "Please wait while images are being uploaded to backend..."
                    : "Drag and drop images here, or click to select files"}
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: JPG, JPEG, PNG, WebP (max 10MB each)
                </p>
              </div>

              {uploadedImages.length < MAX_IMAGES && !isUploading && (
                <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                  <FileImage className="h-5 w-5 mr-2" />
                  Select Images
                </Button>
              )}
              {isUploading && (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Image Grid */}
          {uploadedImages.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Uploaded Images
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Image Preview */}
                    <div className="aspect-square relative">
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Status Overlay */}
                      {image.status === "uploading" && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">{image.progress}%</p>
                          </div>
                        </div>
                      )}

                      {image.status === "success" && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}

                      {image.status === "error" && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Image Info */}
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate mb-1">
                        {image.file.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {(image.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium ${
                            image.status === "success"
                              ? "text-green-600"
                              : image.status === "error"
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {image.status === "uploading" &&
                            `Uploading ${image.progress}%`}
                          {image.status === "success" && "Uploaded"}
                          {image.status === "error" && "Failed"}
                        </span>

                        <div className="flex items-center space-x-1">
                          {image.status === "error" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryUpload(image.id)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              title="Retry upload"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(image.id)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Error Message */}
                      {image.status === "error" && image.error && (
                        <p
                          className="text-xs text-red-600 mt-1 truncate"
                          title={image.error}
                        >
                          {image.error}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {image.status === "uploading" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300 ease-out"
                          style={{ width: `${image.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {/* {successfulUploads > 0 && (
            <div className="mt-8 flex justify-center space-x-4">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                onClick={() => {
                  // Here you would typically submit the uploaded images for processing
                  alert(`${successfulUploads} images ready for processing!`);
                }}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Process {successfulUploads} Images
              </Button>
            </div>
          )} */}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Complete Officer Details First
          </h3>
          <p className="text-gray-600">
            Please select your point name and officer name above to access the
            image upload area.
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkImageUpload;
