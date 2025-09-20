import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate initial scale to fill container
  const calculateInitialScale = useCallback(() => {
    if (imageRef.current && containerRef.current && isImageLoaded) {
      const container = containerRef.current;
      const image = imageRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imageAspectRatio = image.naturalWidth / image.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let fillScale;

      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider - fill height
        fillScale = containerHeight / image.naturalHeight;
      } else {
        // Image is taller - fill width
        fillScale = containerWidth / image.naturalWidth;
      }

      // Ensure minimum scale for proper filling
      fillScale = Math.max(
        fillScale,
        Math.min(
          containerWidth / image.naturalWidth,
          containerHeight / image.naturalHeight
        )
      );

      setInitialScale(fillScale);
      setScale(fillScale);
      setPosition({ x: 0, y: 0 });
    }
  }, [isImageLoaded]);

  useEffect(() => {
    calculateInitialScale();

    const handleResize = () => {
      calculateInitialScale();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateInitialScale]);

  const handleZoomIn = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      if (initialScale > 0) {
        setScale((prev) => Math.min(prev * 1.3, initialScale * 5));
      }
    },
    [initialScale]
  );

  const handleZoomOut = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      if (initialScale > 0) {
        setScale((prev) => Math.max(prev / 1.3, initialScale * 0.3));
      }
    },
    [initialScale]
  );

  const handleReset = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
    },
    [initialScale]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!allowInlineZoom) return;

    if (containerRef.current && imageRef.current) {
      const container = containerRef.current;
      const image = imageRef.current;

      const scaledWidth = image.naturalWidth * scale;
      const scaledHeight = image.naturalHeight * scale;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Only enable dragging if scaled image is larger than container
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
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !allowInlineZoom) return;

    e.preventDefault();
    e.stopPropagation();

    if (containerRef.current && imageRef.current) {
      const container = containerRef.current;
      const image = imageRef.current;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const scaledWidth = image.naturalWidth * scale;
      const scaledHeight = image.naturalHeight * scale;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
      const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);

      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      });
    }
  };

  const handleMouseUp = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!allowInlineZoom) return;

      // Prevent the event from bubbling up to prevent page zoom
      e.preventDefault();
      e.stopPropagation();

      if (initialScale > 0) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) =>
          Math.max(initialScale * 0.3, Math.min(initialScale * 5, prev * delta))
        );
      }
    },
    [allowInlineZoom, initialScale]
  );

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!allowInlineZoom) return;

    e.preventDefault();
    e.stopPropagation();

    if (Math.abs(scale - initialScale) < 0.1) {
      setScale(initialScale * 2);
    } else {
      handleReset();
    }
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  // Helper function to determine cursor class
  const getCursorClass = () => {
    if (!allowInlineZoom) return "cursor-default";

    if (containerRef.current && imageRef.current) {
      const container = containerRef.current;
      const image = imageRef.current;

      const scaledWidth = image.naturalWidth * scale;
      const scaledHeight = image.naturalHeight * scale;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      if (scaledWidth > containerWidth || scaledHeight > containerHeight) {
        return "cursor-grab";
      }
    }

    return "cursor-zoom-in";
  };

  return (
    <div
      ref={containerRef}
      className="relative group w-full h-full overflow-hidden rounded-lg bg-muted flex items-center justify-center"
      onMouseEnter={() => allowInlineZoom && setShowControls(true)}
      onMouseLeave={() =>
        allowInlineZoom && !isDragging && setShowControls(false)
      }
      style={{ isolation: "isolate" }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={`max-w-none max-h-none object-contain transition-transform duration-200 ${
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
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        draggable={false}
      />

      {/* Plate Number */}
      {plateNumber && (
        <div className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-sm text-card-foreground px-2 py-1 rounded text-xs font-mono z-10 border border-border">
          {plateNumber}
        </div>
      )}

      {/* Inline Controls - Show on hover or when zoomed */}
      {allowInlineZoom &&
        (showControls || Math.abs(scale - initialScale) > 0.1) && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              title="Fit to Container"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}

      {/* Zoom level indicator */}
      {allowInlineZoom && Math.abs(scale - initialScale) > 0.1 && (
        <div className="absolute bottom-2 right-2  text-card-foreground  z-10 ">
          <Button variant="outline" size="sm">
            {Math.round((scale / initialScale) * 100)}%
          </Button>
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
