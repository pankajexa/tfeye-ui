import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";

interface ImageZoomProps {
  src: string;
  alt: string;
  plateNumber?: string;
  allowInlineZoom?: boolean;
}

const ImageZoom: React.FC<ImageZoomProps> = ({
  src,
  alt,
  plateNumber,
  allowInlineZoom = true,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const [initialScale, setInitialScale] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [displayDimensions, setDisplayDimensions] = useState({
    width: 0,
    height: 0,
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate initial scale to fill container and displayed image dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (imageRef.current && containerRef.current) {
        const container = containerRef.current;
        const image = imageRef.current;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imageAspectRatio = image.naturalWidth / image.naturalHeight;
        const containerAspectRatio = containerWidth / containerHeight;

        let displayWidth, displayHeight, fillScale;

        if (imageAspectRatio > containerAspectRatio) {
          // Image is wider than container ratio
          displayWidth = containerWidth;
          displayHeight = containerWidth / imageAspectRatio;
          // Calculate scale to fill container height
          fillScale = containerHeight / displayHeight;
        } else {
          // Image is taller than container ratio
          displayHeight = containerHeight;
          displayWidth = containerHeight * imageAspectRatio;
          // Calculate scale to fill container width
          fillScale = containerWidth / displayWidth;
        }

        // Set initial scale to fill the container
        setInitialScale(fillScale);
        if (scale === 1) {
          setScale(fillScale);
        }

        setDisplayDimensions({ width: displayWidth, height: displayHeight });
        setImageDimensions({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [src, scale]);

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setScale((prev) => Math.min(prev + 0.5, initialScale * 5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setScale((prev) => Math.max(prev - 0.5, initialScale * 0.3));
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (allowInlineZoom) {
      // Only allow dragging if the scaled image is larger than the container
      if (containerRef.current && displayDimensions.width > 0) {
        const effectiveScale = scale / initialScale;
        const scaledWidth =
          displayDimensions.width * initialScale * effectiveScale;
        const scaledHeight =
          displayDimensions.height * initialScale * effectiveScale;
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        // Only enable dragging if image is larger than container in at least one dimension
        if (scaledWidth > containerWidth || scaledHeight > containerHeight) {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
          setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
          });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && allowInlineZoom) {
      e.preventDefault();
      e.stopPropagation();

      if (containerRef.current && displayDimensions.width > 0) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Calculate boundaries based on scaled display dimensions relative to initial scale
        const effectiveScale = scale / initialScale;
        const scaledWidth =
          displayDimensions.width * initialScale * effectiveScale;
        const scaledHeight =
          displayDimensions.height * initialScale * effectiveScale;
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
        const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);

        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      }
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (allowInlineZoom) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      setScale((prev) =>
        Math.max(initialScale * 0.3, Math.min(initialScale * 5, prev + delta))
      );
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (allowInlineZoom) {
      e.preventDefault();
      e.stopPropagation();
      if (Math.abs(scale - initialScale) < 0.1) {
        setScale(initialScale * 2);
      } else {
        handleReset();
      }
    }
  };

  const handleMouseEnter = () => {
    if (allowInlineZoom) {
      setShowControls(true);
    }
  };

  const handleMouseLeave = () => {
    if (allowInlineZoom && !isDragging) {
      setShowControls(false);
    }
  };

  const handleImageMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleImageLoad = () => {
    // Trigger dimension calculation when image loads
    if (imageRef.current && containerRef.current) {
      const event = new Event("resize");
      window.dispatchEvent(event);
    }
  };

  // Helper function to determine cursor class
  const getCursorClass = () => {
    if (!allowInlineZoom) return "cursor-default";

    if (containerRef.current && displayDimensions.width > 0) {
      const effectiveScale = scale / initialScale;
      const scaledWidth =
        displayDimensions.width * initialScale * effectiveScale;
      const scaledHeight =
        displayDimensions.height * initialScale * effectiveScale;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // Show grab cursor only if image is larger than container
      if (scaledWidth > containerWidth || scaledHeight > containerHeight) {
        return "cursor-grab";
      }
    }

    return "cursor-zoom-in";
  };

  return (
    <div
      ref={containerRef}
      className="relative group w-full h-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ isolation: "isolate" }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
          allowInlineZoom ? getCursorClass() : "cursor-default"
        } ${isDragging ? "cursor-grabbing" : ""}`}
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${
            position.y / scale
          }px)`,
          transformOrigin: "center center",
        }}
        loading="lazy"
        onLoad={handleImageLoad}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleImageMouseLeave}
        onWheel={handleWheel}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        draggable={false}
      />

      {/* Plate Number */}
      {plateNumber && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-mono z-10">
          {plateNumber}
        </div>
      )}

      {/* Inline Controls - Show on hover or when zoomed */}
      {allowInlineZoom && (showControls || scale !== initialScale) && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleZoomIn}
            className="opacity-90 hover:opacity-100"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleZoomOut}
            className="opacity-90 hover:opacity-100"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleReset}
            className="opacity-90 hover:opacity-100"
            title="Fit to Container"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Zoom level indicator */}
      {allowInlineZoom && Math.abs(scale - initialScale) > 0.1 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-mono z-10">
          {Math.round((scale / initialScale) * 100)}%
        </div>
      )}
    </div>
  );
};

export default React.memo(ImageZoom, (prev, next) => {
  return (
    prev.src === next.src &&
    prev.alt === next.alt &&
    prev.plateNumber === next.plateNumber &&
    prev.allowInlineZoom === next.allowInlineZoom
  );
});
