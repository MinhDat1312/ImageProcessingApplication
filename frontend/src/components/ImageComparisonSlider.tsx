import React, { useState, useRef, useEffect } from "react";

interface ImageComparisonSliderProps {
  originalUrl: string;
  processedUrl: string;
  height?: string | number;
}

export function ImageComparisonSlider({
  originalUrl,
  processedUrl,
  height = "400px",
}: ImageComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  return (
    <div
      ref={containerRef}
      className="image-comparison-slider-container"
      style={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        userSelect: "none",
        cursor: isDragging ? "ew-resize" : "default",
      }}
    >
      {/* Processed (After) Image - Background */}
      <img
        src={processedUrl}
        alt="Processed"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        draggable={false}
      />

      {/* Label for Processed */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          color: "rgba(255, 255, 255, 0.9)",
          padding: "4px 10px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600,
          pointerEvents: "none",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(4px)",
          zIndex: 5,
        }}
      >
        Processed (After)
      </div>

      {/* Original (Before) Image - Foreground (Clipped) */}
      <img
        src={originalUrl}
        alt="Original"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
        draggable={false}
      />

      {/* Label for Original */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          color: "rgba(255, 255, 255, 0.9)",
          padding: "4px 10px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600,
          pointerEvents: "none",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(4px)",
          zIndex: 5,
        }}
      >
        Original (Before)
      </div>

      {/* Slider Line/Handle */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: "2px",
          backgroundColor: "var(--primary, #39d6ff)",
          cursor: "ew-resize",
          transform: "translateX(-50%)",
          zIndex: 10,
          boxShadow: "0 0 10px rgba(57, 214, 255, 0.6)",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Handle Button */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "rgba(10, 10, 15, 0.8)",
            border: "2px solid var(--primary, #39d6ff)",
            boxShadow: "0 0 10px rgba(57, 214, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 6px",
            cursor: "ew-resize",
            backdropFilter: "blur(6px)",
          }}
        >
          {/* Left Arrow Icon */}
          <span style={{ color: "var(--primary, #39d6ff)", fontSize: "10px", fontWeight: "bold" }}>◀</span>
          {/* Right Arrow Icon */}
          <span style={{ color: "var(--primary, #39d6ff)", fontSize: "10px", fontWeight: "bold" }}>▶</span>
        </div>
      </div>
    </div>
  );
}
