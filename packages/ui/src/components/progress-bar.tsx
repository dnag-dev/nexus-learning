import React from "react";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: "default" | "success" | "warning" | "constellation";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantColors: Record<string, string> = {
    default: "bg-aauti-primary",
    success: "bg-aauti-success",
    warning: "bg-aauti-warning",
    constellation: "bg-gradient-to-r from-constellation-glowing to-constellation-bright",
  };

  const sizeStyles: Record<string, string> = {
    sm: "h-1.5",
    md: "h-3",
    lg: "h-5",
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm text-aauti-text-secondary">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-aauti-text-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progress"}
      >
        <div
          className={`${variantColors[variant]} ${sizeStyles[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
