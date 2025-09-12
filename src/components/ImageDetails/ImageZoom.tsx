import React, { useState, useRef } from "react";
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
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1 && allowInlineZoom) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1 && allowInlineZoom) {
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Add boundaries to prevent dragging too far
        const maxX = (rect.width * (scale - 1)) / 2;
        const maxY = (rect.height * (scale - 1)) / 2;

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
      setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (allowInlineZoom) {
      e.preventDefault();
      e.stopPropagation();
      if (scale === 1) {
        setScale(2);
      } else {
        handleReset();
      }
    }
  };

  // Show/hide controls on hover
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

  return (
    <div
      ref={containerRef}
      className="relative group w-full h-full overflow-hidden rounded-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ isolation: "isolate" }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-200 ${
          allowInlineZoom && scale > 1
            ? "cursor-grab"
            : allowInlineZoom
            ? "cursor-zoom-in"
            : "cursor-default"
        } ${isDragging ? "cursor-grabbing" : ""}`}
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${
            position.y / scale
          }px)`,
          transformOrigin: "center center",
        }}
        loading="lazy"
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
      {allowInlineZoom && (showControls || scale > 1) && (
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
            title="Reset Zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}


      {allowInlineZoom && scale !== 1 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-mono z-10">
          {Math.round(scale * 100)}%
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
