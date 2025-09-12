"use client";

import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "gray"
    | "red"
    | "yellow"
    | "green"
    | "blue"
    | "indigo"
    | "purple"
    | "pink"
    | "teal"
    | "orange";
  size?: "sm" | "md" | "lg";
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
}

const variantStyles: Record<string, string> = {
  gray: "bg-gray-50 text-gray-600 inset-ring inset-ring-gray-500/10",
  red: "bg-red-50 text-red-700 inset-ring inset-ring-red-600/10",
  yellow: "bg-yellow-50 text-yellow-800 inset-ring inset-ring-yellow-600/20",
  green: "bg-green-50 text-green-700 inset-ring inset-ring-green-600/20",
  blue: "bg-blue-50 text-blue-700 inset-ring inset-ring-blue-700/10",
  indigo: "bg-indigo-50 text-indigo-700 inset-ring inset-ring-indigo-700/10",
  purple: "bg-purple-50 text-purple-700 inset-ring inset-ring-purple-700/10",
  pink: "bg-pink-50 text-pink-700 inset-ring inset-ring-pink-700/10",
  teal: "bg-teal-50 text-teal-700 inset-ring inset-ring-teal-700/10",
  orange: "bg-orange-50 text-orange-700 inset-ring inset-ring-orange-700/10",
};

const sizeStyles: Record<string, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

const roundedStyles: Record<string, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "gray",
  size = "sm",
  rounded = "md",
  className,
}) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium",
        variantStyles[variant],
        sizeStyles[size],
        roundedStyles[rounded],
        className
      )}
    >
      {children}
    </span>
  );
};
